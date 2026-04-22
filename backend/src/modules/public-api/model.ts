import { t, type UnwrapSchema } from "elysia";

const NullableString = t.Union([t.String(), t.Null()]);
const MAX_MEMORY_CONTENT_LENGTH = 180;

export const PublicApiModel = {
  keyMissingResponse: t.Object({
    message: t.Literal("Valid X-API-Key header required")
  }),
  rateLimitedResponse: t.Object({
    message: t.Literal("Public API rate limit exceeded. Please retry in a moment.")
  }),

  profileResponse: t.Object({
    id: t.String(),
    username: t.String(),
    email: t.String({ format: "email" })
  }),

  memoryResponse: t.Object({
    id: t.String(),
    content: t.String(),
    date: t.String({ format: "date" }),
    isOpen: t.Boolean(),
    shareToken: NullableString,
    mediaUrl: NullableString,
    createdAt: t.String({ format: "date-time" }),
    updatedAt: t.String({ format: "date-time" })
  }),

  paginatedMemoriesResponse: t.Object({
    items: t.Array(
      t.Object({
        id: t.String(),
        content: t.String(),
        date: t.String({ format: "date" }),
        isOpen: t.Boolean(),
        shareToken: NullableString,
        mediaUrl: NullableString,
        createdAt: t.String({ format: "date-time" }),
        updatedAt: t.String({ format: "date-time" })
      })
    ),
    total: t.Number(),
    page: t.Number(),
    limit: t.Number()
  }),

  paginationQuery: t.Object({
    page: t.Optional(t.Number({ minimum: 1, default: 1 })),
    limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 }))
  }),

  createMemoryBody: t.Object({
    content: t.String({ minLength: 1, maxLength: MAX_MEMORY_CONTENT_LENGTH }),
    date: t.Optional(t.String({ format: "date" })),
    isOpen: t.Optional(t.Boolean())
  }),

  replaceMemoryBody: t.Object({
    content: t.String({ minLength: 1, maxLength: MAX_MEMORY_CONTENT_LENGTH }),
    isOpen: t.Optional(t.Boolean())
  })
} as const;

export type PublicApiModel = {
  [k in keyof typeof PublicApiModel]: UnwrapSchema<(typeof PublicApiModel)[k]>;
};
