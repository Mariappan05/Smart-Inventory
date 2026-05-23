import { AlertRepository } from "@/repositories/alertRepository";
import { AuditService } from "@/services/auditService";
import { defaultNotifier } from "@/services/utils/notificationBus";
import { toServiceError } from "@/services/base/serviceError";

type AlertSeverity = "LOW" | "MEDIUM" | "HIGH";
type AlertCreateInput = Parameters<AlertRepository["create"]>[0];

export type CreateSecurityAlertInput = {
  machineId: string;
  title: string;
  description?: string;
  severity?: AlertSeverity;
  reportedById?: string | null;
  storeId?: string | null;
};

export class AlertService {
  constructor(
    private readonly alertRepository = new AlertRepository(),
    private readonly notifier = defaultNotifier,
    private readonly auditService = new AuditService()
  ) {}

  async createSecurityAlert(input: CreateSecurityAlertInput) {
    try {
      const alert = await this.alertRepository.create({
        product: { connect: { id: input.machineId } },
        title: input.title,
        description: input.description,
        severity: input.severity ?? "HIGH",
        status: "OPEN",
        ...(input.reportedById ? { reportedBy: { connect: { id: input.reportedById } } } : {}),
        ...(input.storeId ? { store: { connect: { id: input.storeId } } } : {}),
      });

      this.notifier.publish({ type: "alert.created", payload: alert, createdAt: new Date() });
      await this.auditService.logAction({
        actorId: input.reportedById ?? null,
        action: "ALERT_CREATED",
        entity: "SecurityAlert",
        entityId: alert.id,
        metadata: {
          machineId: input.machineId,
          severity: input.severity ?? "HIGH",
        },
      });
      return alert;
    } catch (error) {
      throw toServiceError(error, "Failed to create security alert");
    }
  }

  async create(data: AlertCreateInput) {
    try {
      const alert = await this.alertRepository.create(data);
      this.notifier.publish({ type: "alert.created", payload: alert, createdAt: new Date() });
      return alert;
    } catch (error) {
      throw toServiceError(error, "Failed to create alert");
    }
  }

  async acknowledge(id: string) {
    try {
      const alert = await this.alertRepository.update(id, { status: "ACKNOWLEDGED" });
      this.notifier.publish({ type: "alert.acknowledged", payload: alert, createdAt: new Date() });
      await this.auditService.logAction({
        action: "ALERT_ACKNOWLEDGED",
        entity: "SecurityAlert",
        entityId: alert.id,
        metadata: { status: "ACKNOWLEDGED" },
      });
      return alert;
    } catch (error) {
      throw toServiceError(error, "Failed to acknowledge alert");
    }
  }

  async resolve(id: string) {
    try {
      const alert = await this.alertRepository.update(id, { status: "RESOLVED", resolvedAt: new Date() });
      this.notifier.publish({ type: "alert.resolved", payload: alert, createdAt: new Date() });
      await this.auditService.logAction({
        action: "ALERT_RESOLVED",
        entity: "SecurityAlert",
        entityId: alert.id,
        metadata: { status: "RESOLVED" },
      });
      return alert;
    } catch (error) {
      throw toServiceError(error, "Failed to resolve alert");
    }
  }

  async findById(id: string) {
    try {
      return await this.alertRepository.findById(id);
    } catch (error) {
      throw toServiceError(error, "Failed to find alert");
    }
  }

  async findAll() {
    try {
      return await this.alertRepository.findAll();
    } catch (error) {
      throw toServiceError(error, "Failed to fetch alerts");
    }
  }

  async search(term: string, options = {}) {
    try {
      return await this.alertRepository.search(term, options);
    } catch (error) {
      throw toServiceError(error, "Failed to search alerts");
    }
  }

  async paginate(options = {}, storeId?: string) {
    try {
      return await this.alertRepository.paginate(options, storeId);
    } catch (error) {
      throw toServiceError(error, "Failed to paginate alerts");
    }
  }

  async findOpenAlerts(storeId?: string) {
    try {
      return await this.alertRepository.findOpenAlerts(storeId);
    } catch (error) {
      throw toServiceError(error, "Failed to fetch open alerts");
    }
  }

  async findRecentAlerts(limit = 10, storeId?: string) {
    try {
      return await this.alertRepository.findRecentAlerts(limit, storeId);
    } catch (error) {
      throw toServiceError(error, "Failed to fetch recent alerts");
    }
  }

  async findByMachineId(machineId: string) {
    try {
      return await this.alertRepository.findByMachineId(machineId);
    } catch (error) {
      throw toServiceError(error, "Failed to fetch alerts by machine");
    }
  }
}
