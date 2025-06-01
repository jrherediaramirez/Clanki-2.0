import { z } from "zod";

export class AnkiError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = "AnkiError";
  }
}

export class ValidationError extends Error {
  constructor(message: string, public zodError?: z.ZodError) {
    super(message);
    this.name = "ValidationError";
  }
}

export function handleZodError(error: z.ZodError): string {
  return `Invalid arguments: ${error.errors
    .map((e) => `${e.path.join(".")}: ${e.message}`)
    .join(", ")}`;
}

export function isZodError(error: unknown): error is z.ZodError {
  return error instanceof z.ZodError;
}