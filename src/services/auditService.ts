import { AuditRepository } from "@/repositories/auditRepository";
import { toServiceError } from "@/services/base/serviceError";

export type AuditLogInput = {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
};

export class AuditService {
  constructor(private readonly auditRepository = new AuditRepository()) {}

  async logAction(input: AuditLogInput) {
    try {
      return await this.auditRepository.create({
        action: input.action,
        entity: input.entity,
        ...(input.actorId ? { actor: { connect: { id: input.actorId } } } : {}),
        ...(input.entityId ? { entityId: input.entityId } : {}),
        ...(input.ipAddress ? { ipAddress: input.ipAddress } : {}),
        ...(input.userAgent ? { userAgent: input.userAgent } : {}),
        ...(input.metadata ? { metadata: input.metadata as any } : {}),
      });
    } catch (error) {
      throw toServiceError(error, "Failed to write audit log");
    }
  }

  async getRecent(limit = 10) {
    try {
      return await this.auditRepository.findRecent(limit);
    } catch (error) {
      throw toServiceError(error, "Failed to fetch audit logs");
    }
  }
}
