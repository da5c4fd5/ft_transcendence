import { Elysia, ElysiaCustomStatusResponse } from "elysia";
import { Prisma } from "../../generated/prisma/client";

export const errorHandlerPlugin = new Elysia({ name: "error-handler" }).onError(
  { as: "global" },
  ({ code, error, set }) => {
    // Pass through throw status(...) responses from services unchanged
    if (error instanceof ElysiaCustomStatusResponse) {
      set.status = error.code;
      return error.response;
    }

    // Prisma known errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        set.status = 404;
        return { message: "Not found" };
      }
      if (error.code === "P2002") {
        set.status = 409;
        return { message: "Already exists" };
      }
    }

    switch (code) {
      case "VALIDATION": {
        set.status = 422;
        const parsed = JSON.parse((error as Error).message);
        return {
          message: "Validation error",
          errors: (parsed.errors ?? []).map(
            (e: { path: string; summary?: string; message: string }) => ({
              path: e.path,
              message: e.summary ?? e.message
            })
          )
        };
      }
      case "NOT_FOUND":
        set.status = 404;
        return { message: "Not found" };
      default:
        set.status = 500;
        console.error(error);
        return { message: "Internal server error" };
    }
  }
);
