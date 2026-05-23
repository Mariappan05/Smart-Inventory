export class ServiceError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "ServiceError";
  }
}

export function toServiceError(error: unknown, message: string) {
  if (error instanceof ServiceError) {
    return error;
  }

  return new ServiceError(message, error);
}
