import QRCode from "qrcode";
import type { QrScanLog, Product, ScanSource } from "@prisma/client";
import { toServiceError } from "@/services/base/serviceError";
import { ProductRepository } from "@/repositories/productRepository";
import { QRRepository } from "@/repositories/qrRepository";
import { buildMachineQRPayload, createQRPayload, getQRCodeFileName, isValidQRPayload, parseQRPayload } from "@/utils/qr";

export type QrPayload = {
  data: string;
  width?: number;
};

export type QRValidationResult = {
  valid: boolean;
  message: string;
  payload?: ReturnType<typeof parseQRPayload>;
  product?: Product & {
    item?: { name: string } | null;
    type?: { name: string } | null;
    supplier?: { name: string } | null;
    plant?: { name: string } | null;
    images?: { url: string; isPrimary: boolean }[];
  };
};

export type QRScanInput = {
  payload: string;
  scannedById?: string | null;
  source?: ScanSource;
};

export class QRService {
  constructor(
    private readonly machineRepository = new ProductRepository(),
    private readonly qrRepository = new QRRepository()
  ) {}

  async generateDataUrl(payload: QrPayload) {
    try {
      return await QRCode.toDataURL(payload.data, {
        width: payload.width ?? 320,
        margin: 1,
      });
    } catch (error) {
      throw toServiceError(error, "Failed to generate QR code");
    }
  }

  async generateMachineQR(machineId: string, width = 320) {
    try {
      const machine = await this.machineRepository.findById(machineId);

      if (!machine) {
        throw new Error("Machine not found");
      }

      const payload = buildMachineQRPayload({
        machineId: machine.id,
        assetTag: machine.serial,
        label: machine.item?.name || machine.serial,
      });

      const dataUrl = await this.generateDataUrl({ data: payload, width });

      return {
        machine,
        payload,
        dataUrl,
        fileName: getQRCodeFileName(machine.serial),
      };
    } catch (error) {
      throw toServiceError(error, "Failed to generate machine QR code");
    }
  }

  async validatePayload(rawValue: string): Promise<QRValidationResult> {
    try {
      const payload = parseQRPayload(rawValue);

      if (!payload) {
        return {
          valid: false,
          message: "Invalid QR payload format",
        };
      }

      if (payload.kind !== "machine") {
        return {
          valid: false,
          message: "Unsupported QR code kind",
          payload,
        };
      }

      const machine = await this.machineRepository.findById(payload.id);

      if (!machine) {
        return {
          valid: false,
          message: "Product not found for this QR code",
          payload,
        };
      }

      if (machine.serial !== payload.assetTag) {
        return {
          valid: false,
          message: "QR code does not match product serial",
          payload,
          product: machine,
        };
      }

      return {
        valid: true,
        message: "QR code validated successfully",
        payload,
        product: machine,
      };
    } catch (error) {
      throw toServiceError(error, "Failed to validate QR code");
    }
  }

  async logScan(input: QRScanInput): Promise<QrScanLog> {
    try {
      const validation = await this.validatePayload(input.payload);

      if (!validation.valid || !validation.payload || !validation.product) {
        throw new Error(validation.message);
      }

      return await this.qrRepository.create({
        payload: input.payload,
        source: input.source ?? "MOBILE",
        product: { connect: { id: validation.product.id } },
        ...(input.scannedById ? { scannedBy: { connect: { id: input.scannedById } } } : {}),
      });
    } catch (error) {
      throw toServiceError(error, "Failed to log QR scan");
    }
  }

  async getScanLogs(page = 1, pageSize = 10, storeId?: string) {
    try {
      return await this.qrRepository.paginate({ page, pageSize }, storeId);
    } catch (error) {
      throw toServiceError(error, "Failed to fetch QR scan logs");
    }
  }

  async getMachineScanLogs(machineId: string) {
    try {
      return await this.qrRepository.findByMachineId(machineId);
    } catch (error) {
      throw toServiceError(error, "Failed to fetch machine QR scan logs");
    }
  }

  async getLatestScanByMachine(machineId: string) {
    try {
      return await this.qrRepository.findLatestByMachineId(machineId);
    } catch (error) {
      throw toServiceError(error, "Failed to fetch latest QR scan log");
    }
  }

  async generateMachineDownload(machineId: string) {
    const { dataUrl, fileName } = await this.generateMachineQR(machineId);
    return { dataUrl, fileName };
  }
}
