import { Elysia, t } from "elysia";
import {
  authenticatePublicApiKey,
  consumePublicApiRateLimit
} from "../../lib/public-api";
import { PublicApiModel } from "./model";
import { PublicApiService } from "./service";

export const publicApi = new Elysia({
  prefix: "/public-api",
  detail: {
    tags: ["Public API"],
    security: [{ apiKeyAuth: [] }]
  }
})
  .derive(async ({ headers }) => {
    const headerValue = headers["x-api-key"] ?? headers["X-API-Key"];
    const rawKey =
      typeof headerValue === "string"
        ? headerValue
        : Array.isArray(headerValue)
          ? headerValue[0]
          : undefined;

    return {
      publicApiAuth: rawKey
        ? await authenticatePublicApiKey(rawKey)
        : null
    };
  })
  .guard(
    {
      beforeHandle: ({ publicApiAuth, set, status }) => {
        if (!publicApiAuth) {
          return status(401, {
            message: "Valid X-API-Key header required"
          });
        }

        const rate = consumePublicApiRateLimit(publicApiAuth.keyHash);
        set.headers["X-RateLimit-Limit"] = String(rate.limit);
        set.headers["X-RateLimit-Remaining"] = String(rate.remaining);
        set.headers["X-RateLimit-Reset"] = String(rate.resetAt);

        if (rate.limited) {
          set.headers["Retry-After"] = String(rate.retryAfterSeconds);
          return status(429, {
            message: "Public API rate limit exceeded. Please retry in a moment."
          });
        }
      }
    },
    (app) =>
      app
        .get("/me", ({ publicApiAuth }) => PublicApiService.getProfile(publicApiAuth!), {
          response: {
            200: PublicApiModel.profileResponse,
            401: PublicApiModel.keyMissingResponse,
            429: PublicApiModel.rateLimitedResponse
          },
          detail: {
            description:
              "Return the owner profile bound to the supplied X-API-Key."
          }
        })
        .get(
          "/memories",
          ({ publicApiAuth, query }) =>
            PublicApiService.listMemories(publicApiAuth!.userId, query),
          {
            query: PublicApiModel.paginationQuery,
            response: {
              200: PublicApiModel.paginatedMemoriesResponse,
              401: PublicApiModel.keyMissingResponse,
              429: PublicApiModel.rateLimitedResponse
            },
            detail: {
              description:
                "Paginated list of the API owner's memories."
            }
          }
        )
        .get(
          "/memories/:memoryId",
          ({ publicApiAuth, params }) =>
            PublicApiService.findMemory(publicApiAuth!.userId, params.memoryId),
          {
            response: {
              200: PublicApiModel.memoryResponse,
              401: PublicApiModel.keyMissingResponse,
              429: PublicApiModel.rateLimitedResponse
            },
            detail: {
              description:
                "Return one memory owned by the API key holder."
            }
          }
        )
        .post(
          "/memories",
          ({ publicApiAuth, body }) =>
            PublicApiService.createMemory(publicApiAuth!.userId, body),
          {
            body: PublicApiModel.createMemoryBody,
            response: {
              200: PublicApiModel.memoryResponse,
              401: PublicApiModel.keyMissingResponse,
              429: PublicApiModel.rateLimitedResponse
            },
            detail: {
              description:
                "Create a memory owned by the API key holder."
            }
          }
        )
        .put(
          "/memories/:memoryId",
          ({ publicApiAuth, params, body }) =>
            PublicApiService.replaceMemory(
              publicApiAuth!.userId,
              params.memoryId,
              body
            ),
          {
            body: PublicApiModel.replaceMemoryBody,
            response: {
              200: PublicApiModel.memoryResponse,
              401: PublicApiModel.keyMissingResponse,
              429: PublicApiModel.rateLimitedResponse
            },
            detail: {
              description:
                "Replace a memory's content or sharing flag. The same current-day edit rules apply as in the private app."
            }
          }
        )
        .delete(
          "/memories/:memoryId",
          ({ publicApiAuth, params }) =>
            PublicApiService.deleteMemory(publicApiAuth!.userId, params.memoryId),
          {
            response: {
              204: t.Any(),
              401: PublicApiModel.keyMissingResponse,
              429: PublicApiModel.rateLimitedResponse
            },
            detail: {
              description:
                "Delete a memory owned by the API key holder. The same current-day delete rule applies as in the private app."
            }
          }
        )
  );
