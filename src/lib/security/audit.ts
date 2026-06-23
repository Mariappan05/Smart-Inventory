// Audit Logging System
import { prisma } from "@/lib/prisma";
import { securityConfig } from "@/config/security";

export enum AuditEventType {
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGOUT = "LOGOUT",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  DATA_CREATED = "DATA_CREATED",
  DATA_UPDATED = "DATA_UPDATED",
  DATA_DELETED = "DATA_DELETED",
  ACCESS_DENIED = "ACCESS_DENIED",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  FILE_UPLOAD = "FILE_UPLOAD",
  FILE_DOWNLOAD = "FILE_DOWNLOAD",
  PERMISSION_CHANGED = "PERMISSION_CHANGED",
}

export interface AuditLogEntry {
  eventType: AuditEventType;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Flush logs to database every 30 seconds
    if (securityConfig.audit.enabled) {
      this.flushInterval = setInterval(() => {
        this.flush();
      }, 30000);
    }
  }

  async log(entry: Omit<AuditLogEntry, "timestamp">): Promise<void> {
    if (!securityConfig.audit.enabled) return;

    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date(),
    };

    // Filter based on configuration
    const shouldLog = this.shouldLog(logEntry);
    if (!shouldLog) return;

    this.logs.push(logEntry);

    // Console log in development
    if (process.env.NODE_ENV !== "production") {
      console.log(`[AUDIT] ${logEntry.eventType}:`, {
        userId: logEntry.userId,
        resource: logEntry.resource,
        success: logEntry.success,
      });
    }

    // Flush immediately for critical events
    if (this.isCriticalEvent(logEntry.eventType)) {
      await this.flush();
    }
  }

  private shouldLog(entry: AuditLogEntry): boolean {
    const config = securityConfig.audit;

    if (entry.eventType === AuditEventType.LOGIN_SUCCESS && !config.logSuccessfulLogins) {
      return false;
    }

    if (entry.eventType === AuditEventType.LOGIN_FAILED && !config.logFailedLogins) {
      return false;
    }

    if (
      [AuditEventType.DATA_CREATED, AuditEventType.DATA_UPDATED, AuditEventType.DATA_DELETED].includes(entry.eventType) &&
      !config.logDataChanges
    ) {
      return false;
    }

    if (entry.eventType === AuditEventType.ACCESS_DENIED && !config.logAccessDenied) {
      return false;
    }

    return true;
  }

  private isCriticalEvent(eventType: AuditEventType): boolean {
    return [
      AuditEventType.LOGIN_FAILED,
      AuditEventType.ACCESS_DENIED,
      AuditEventType.SUSPICIOUS_ACTIVITY,
      AuditEventType.PERMISSION_CHANGED,
      AuditEventType.USER_DELETED,
    ].includes(eventType);
  }

  private async flush(): Promise<void> {
    if (this.logs.length === 0) return;

    const logsToFlush = [...this.logs];
    this.logs = [];

    try {
      // In a real implementation, save to database
      // For now, we'll just log to console in production
      if (process.env.NODE_ENV === "production") {
        console.log(`[AUDIT] Flushing ${logsToFlush.length} log entries`);
      }

      // You can implement database logging here
      // await prisma.auditLog.createMany({ data: logsToFlush });
    } catch (error) {
      console.error("[AUDIT] Failed to flush logs:", error);
      // Put logs back if flush failed
      this.logs.unshift(...logsToFlush);
    }
  }

  async logLogin(userId: string, email: string, success: boolean, ipAddress?: string, errorMessage?: string): Promise<void> {
    await this.log({
      eventType: success ? AuditEventType.LOGIN_SUCCESS : AuditEventType.LOGIN_FAILED,
      userId: success ? userId : undefined,
      userEmail: email,
      ipAddress,
      success,
      errorMessage,
      resource: "auth",
      action: "login",
    });
  }

  async logLogout(userId: string, email: string, ipAddress?: string): Promise<void> {
    await this.log({
      eventType: AuditEventType.LOGOUT,
      userId,
      userEmail: email,
      ipAddress,
      success: true,
      resource: "auth",
      action: "logout",
    });
  }

  async logAccessDenied(userId: string, email: string, resource: string, ipAddress?: string): Promise<void> {
    await this.log({
      eventType: AuditEventType.ACCESS_DENIED,
      userId,
      userEmail: email,
      ipAddress,
      resource,
      action: "access",
      success: false,
      errorMessage: "Access denied",
    });
  }

  async logDataChange(
    eventType: AuditEventType.DATA_CREATED | AuditEventType.DATA_UPDATED | AuditEventType.DATA_DELETED,
    userId: string,
    resource: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType,
      userId,
      resource,
      action: eventType.toLowerCase().split("_")[1],
      success: true,
      metadata,
    });
  }

  async logSuspiciousActivity(
    userId: string | undefined,
    description: string,
    ipAddress?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
      userId,
      ipAddress,
      success: false,
      errorMessage: description,
      metadata,
    });
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();

// Cleanup on process exit (only in Node.js runtime)
if (typeof process !== "undefined" && typeof process.on === "function") {
  try {
    process.on("beforeExit", () => {
      auditLogger.destroy();
    });
  } catch (error) {
    // Edge runtime doesn't support process.on, ignore
  }
}
