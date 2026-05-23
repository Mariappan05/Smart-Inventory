import { Prisma } from "@prisma/client";

export class RepositoryError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "RepositoryError";
  }
}

export function toRepositoryError(error: unknown, message: string) {
  if (error instanceof RepositoryError) {
    return error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return new RepositoryError(`${message} (${error.code})`, error);
  }

  return new RepositoryError(message, error);
}
