import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import { Response } from "express";

export function inventoryError(
  statusCode: number,
  code: string,
  message: string,
) {
  return { statusCode, code, message };
}

@Catch()
export class InventoryHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    let body = inventoryError(
      500,
      "INVENTORY_PERSISTENCE_FAILED",
      "Inventory persistence failed; retry with the same key",
    );
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const original = exception.getResponse();
      const data =
        typeof original === "object"
          ? (original as { code?: string; message?: string | string[] })
          : { message: original };
      const codes: Record<number, string> = {
        400: "INVALID_INPUT",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "PRODUCT_NOT_FOUND",
        409: "IDEMPOTENCY_KEY_REUSED",
        503: "INVENTORY_BUSY",
      };
      if (status < 500 || status === 503) {
        body = inventoryError(
          status,
          data.code ?? codes[status] ?? "INVALID_INPUT",
          Array.isArray(data.message)
            ? data.message.join("; ")
            : (data.message ?? "Invalid input"),
        );
      }
    } else if (
      ["40P01", "55P03", "57014"].includes(
        (exception as { driverError?: { code?: string }; code?: string } | null)
          ?.driverError?.code ??
          (exception as { code?: string } | null)?.code ??
          "",
      )
    ) {
      body = inventoryError(
        503,
        "INVENTORY_BUSY",
        "Inventory is busy; retry with the same key",
      );
    }
    if (body.statusCode === 503 || body.code === "IDEMPOTENCY_IN_PROGRESS")
      response.setHeader("Retry-After", "1");
    response.status(body.statusCode).json(body);
  }
}
