import { QRService } from "@/services/qrService";
import { ProductService } from "@/services/productService";
import { MovementRepository } from "@/repositories/movementRepository";
import { AlertService } from "@/services/alertService";
import { AuditService } from "@/services/auditService";
import { toServiceError } from "@/services/base/serviceError";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type MachineStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "OUT_OF_STOCK";
type ScanSource = "MOBILE" | "KIOSK" | "API";
type LatestMovement = Awaited<ReturnType<MovementRepository["findLatestByProductId"]>>;

type ValidatedScanResult = Awaited<ReturnType<QRService["validatePayload"]>> & {
  latestMovement?: LatestMovement;
  isCheckedOut?: boolean;
  nextAction?: "IN" | "OUT";
};

export type ScanPayloadInput = {
  payload: string;
  scannedById?: string | null;
  storeId?: string | null;
  source?: ScanSource;
};

export type MovementActionInput = {
  payload: string;
  userId?: string | null;
  storeId?: string | null;
  source?: ScanSource;
  issuedTo?: string;
  issuedToId?: string;
  isInternalTransfer?: boolean;
  transferToUserId?: string;
  reason?: string;
  expectedReturnAt?: string | Date | null;
  conditionNote?: string;
  toStoreRoomId?: string;
};

export class ScanService {
  constructor(
    private readonly qrService = new QRService(),
    private readonly movementRepository = new MovementRepository(),
    private readonly machineService = new ProductService(),
    private readonly alertService = new AlertService(),
    private readonly auditService = new AuditService()
  ) {}

  async validateScan(payload: string): Promise<ValidatedScanResult> {
    try {
      const result = await this.qrService.validatePayload(payload);

      if (!result.valid || !result.product) {
        return result;
      }

      const latestMovement = await this.movementRepository.findLatestByProductId(result.product.id);
      const isCheckedOut = latestMovement?.movementType === "CHECKOUT";

      return {
        ...result,
        latestMovement,
        isCheckedOut,
        nextAction: isCheckedOut ? "IN" : "OUT",
      };
    } catch (error) {
      throw toServiceError(error, "Failed to validate scan");
    }
  }

  async scanQRCode(input: ScanPayloadInput) {
    try {
      const validation = await this.validateScan(input.payload);

      if (!validation.valid || !validation.product) {
        throw new Error(validation.message);
      }

      const log = await this.qrService.logScan({
        payload: input.payload,
        scannedById: input.scannedById,
        source: input.source ?? "MOBILE",
      });

      return { ...validation, log };
    } catch (error) {
      throw toServiceError(error, "Failed to scan QR code");
    }
  }

  async markMachineOut(input: MovementActionInput) {
    try {
      const validation = await this.validateScan(input.payload);
      if (!validation.valid || !validation.product) {
        throw new Error(validation.message || "Invalid QR code");
      }

      const latestMovement = validation.latestMovement ?? (await this.movementRepository.findLatestByProductId(validation.product.id));
      if (latestMovement?.movementType === "CHECKOUT") {
        await this.alertService.createSecurityAlert({
          machineId: validation.product.id,
          title: "Unauthorized checkout attempt",
          description: `Attempted OUT action on ${validation.product.serial} while it is already checked out.`,
          severity: "HIGH",
          reportedById: input.userId ?? null,
        });
        await this.auditService.logAction({
          actorId: input.userId ?? null,
          action: "UNAUTHORIZED_OUT_ATTEMPT",
          entity: "MachineMovement",
          entityId: validation.product.id,
          metadata: { payload: input.payload },
        });
        throw new Error("Machine is already marked OUT");
      }

      const movedAt = new Date();
      const fromStoreRoomId = validation.product.storeId;
      const expectedReturnAt = input.expectedReturnAt ? new Date(input.expectedReturnAt) : null;

      const [outLog, movementLog, machine] = await Promise.all([
        this.movementRepository.createOutLog({
          product: { connect: { id: validation.product.id } },
          fromStore: { connect: { id: fromStoreRoomId } },
          issuedTo: input.issuedTo ?? "Unknown employee",
          reason: input.reason,
          expectedReturnAt,
          outBy: input.userId ? { connect: { id: input.userId } } : undefined,
          outAt: movedAt,
          ...(input.issuedToId ? { issuedToId: input.issuedToId } : {}),
        }),
        this.movementRepository.create({
          product: { connect: { id: validation.product.id } },
          fromStore: { connect: { id: fromStoreRoomId } },
          movedBy: input.userId ? { connect: { id: input.userId } } : undefined,
          movementType: "CHECKOUT",
          movedAt,
          notes: input.issuedTo ? `Issued to: ${input.issuedTo}${input.reason ? ` | ${input.reason}` : ""}` : input.reason,
        }),
        this.machineService.updateStatus(validation.product.id, "IN_USE" as MachineStatus),
      ]);

      // Create notification for internal transfer
      if (input.isInternalTransfer && input.transferToUserId) {
        await this.createTransferNotification({
          userId: input.transferToUserId,
          productId: validation.product.id,
          productSerial: validation.product.serial,
          productName: validation.product.item?.name || "Product",
          fromUser: input.issuedTo || "Unknown",
        });
      }

      // Create notification for the user who checked out
      if (input.userId) {
        await this.createNotification({
          userId: input.userId,
          title: "Product Checked Out",
          message: `${validation.product.item?.name || validation.product.serial} has been checked out successfully`,
          type: "CHECKOUT",
          productId: validation.product.id,
        });
      }

      await this.auditService.logAction({
        actorId: input.userId ?? null,
        action: "MACHINE_CHECKED_OUT",
        entity: "MachineMovement",
        entityId: validation.product.id,
        metadata: {
          issuedTo: input.issuedTo ?? "Unknown employee",
          reason: input.reason ?? null,
          expectedReturnAt: expectedReturnAt?.toISOString() ?? null,
        },
      });

      return { validation, outLog, movementLog, machine };
    } catch (error) {
      throw toServiceError(error, "Failed to mark machine OUT");
    }
  }

  async markMachineIn(input: MovementActionInput) {
    try {
      const validation = await this.validateScan(input.payload);
      if (!validation.valid || !validation.product) {
        throw new Error(validation.message || "Invalid QR code");
      }

      const latestMovement = validation.latestMovement ?? (await this.movementRepository.findLatestByProductId(validation.product.id));
      if (latestMovement?.movementType !== "CHECKOUT") {
        await this.alertService.createSecurityAlert({
          machineId: validation.product.id,
          title: "Unauthorized return attempt",
          description: `Attempted IN action on ${validation.product.serial} without an active checkout.`,
          severity: "MEDIUM",
          reportedById: input.userId ?? null,
        });
        await this.auditService.logAction({
          actorId: input.userId ?? null,
          action: "UNAUTHORIZED_IN_ATTEMPT",
          entity: "MachineMovement",
          entityId: validation.product.id,
          metadata: { payload: input.payload },
        });
        throw new Error("Machine is not currently marked OUT");
      }

      const movedAt = new Date();
      const toStoreRoomId = input.toStoreRoomId || validation.product.storeId;

      const [inLog, movementLog, machine] = await Promise.all([
        this.movementRepository.createInLog({
          product: { connect: { id: validation.product.id } },
          toStore: { connect: { id: toStoreRoomId } },
          inBy: input.userId ? { connect: { id: input.userId } } : undefined,
          conditionNote: input.conditionNote,
          inAt: movedAt,
        }),
        this.movementRepository.create({
          product: { connect: { id: validation.product.id } },
          toStore: { connect: { id: toStoreRoomId } },
          movedBy: input.userId ? { connect: { id: input.userId } } : undefined,
          movementType: "RETURN",
          movedAt,
          notes: input.conditionNote,
        }),
        this.machineService.update(validation.product.id, {
          status: "AVAILABLE",
          Store: { connect: { id: toStoreRoomId } },
        } as any),
      ]);

      // Create notification for the user who checked in
      if (input.userId) {
        await this.createNotification({
          userId: input.userId,
          title: "Product Returned",
          message: `${validation.product.item?.name || validation.product.serial} has been returned successfully`,
          type: "RETURN",
          productId: validation.product.id,
        });
      }

      await this.auditService.logAction({
        actorId: input.userId ?? null,
        action: "MACHINE_CHECKED_IN",
        entity: "MachineMovement",
        entityId: validation.product.id,
        metadata: {
          conditionNote: input.conditionNote ?? null,
          toStoreRoomId,
        },
      });

      return { validation, inLog, movementLog, machine };
    } catch (error) {
      throw toServiceError(error, "Failed to mark machine IN");
    }
  }

  async getLogs(page = 1, pageSize = 10, userId?: string, plantId?: string) {
    try {
      if (userId) {
        return await this.movementRepository.findByUserId(userId, { page, pageSize });
      }
      return await this.movementRepository.paginate({ page, pageSize }, plantId);
    } catch (error) {
      throw toServiceError(error, "Failed to fetch movement logs");
    }
  }

  async getMachineLogs(machineId: string) {
    try {
      return await this.movementRepository.findByProductId(machineId);
    } catch (error) {
      throw toServiceError(error, "Failed to fetch machine movement logs");
    }
  }

  async getLatestMachineState(machineId: string) {
    try {
      const latestMovement = await this.movementRepository.findLatestByProductId(machineId);
      const isCheckedOut = latestMovement?.movementType === "CHECKOUT";
      return { latestMovement, isCheckedOut, currentAction: isCheckedOut ? "IN" : "OUT" };
    } catch (error) {
      throw toServiceError(error, "Failed to fetch machine state");
    }
  }

  private async createTransferNotification(data: {
    userId: string;
    productId: string;
    productSerial: string;
    productName: string;
    fromUser: string;
  }) {
    try {
      // @ts-ignore - Notification model exists but TypeScript cache needs refresh
      await prisma.notification.create({
        data: {
          userId: data.userId,
          title: "Product Transfer Notification",
          message: `${data.productName} (${data.productSerial}) has been transferred to you by ${data.fromUser}`,
          type: "order_created",
          productId: data.productId,
        },
      });
    } catch (error) {
      console.error("Failed to create transfer notification:", error);
    }
  }

  private async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    productId: string;
  }) {
    try {
      // @ts-ignore - Notification model exists but TypeScript cache needs refresh
      await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: (data.type as any) || "order_created",
          productId: data.productId,
        },
      });
    } catch (error) {
      console.error("Failed to create notification:", error);
    }
  }
}
