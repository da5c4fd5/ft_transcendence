import { t, type UnwrapSchema } from "elysia";

const MAX_MEMORY_CONTENT_LENGTH = 180;

export const MemoriesModel = {
  promptResponse: t.Object({
    prompt: t.String()
  }),
  wellnessTipsResponse: t.Object({
    tips: t.Array(t.String())
  }),
  gameQuery: t.Object({
    count: t.Optional(t.Number({ minimum: 1, maximum: 5, default: 5 }))
  }),
  gameMemoryResponse: t.Object({
    id: t.String(),
    date: t.String({ format: "date" }),
    content: t.String(),
    mediaUrl: t.Union([t.String(), t.Null()])
  }),

  createBody: t.Object({
    content: t.String({ minLength: 1, maxLength: MAX_MEMORY_CONTENT_LENGTH }),
    date: t.Optional(t.String({ format: "date" })),
    isOpen: t.Optional(t.Boolean())
  }),
  updateBody: t.Object({
    content: t.Optional(
      t.String({ minLength: 1, maxLength: MAX_MEMORY_CONTENT_LENGTH })
    ),
    isOpen: t.Optional(t.Boolean())
  }),
  mediaBody: t.Object({ file: t.File() }),

  searchQuery: t.Object({
    mood: t.Optional(t.String({ maxLength: 32 })),
    period: t.Optional(
      t.UnionEnum(["week", "month", "year"] as const, {
        description: "Shorthand date range relative to today"
      })
    ),
    after: t.Optional(t.String({ format: "date" })),
    before: t.Optional(t.String({ format: "date" })),
    sharedOnly: t.Optional(t.BooleanString()),
    page: t.Optional(t.Number({ minimum: 1, default: 1 })),
    limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 }))
  }),

  statsResponse: t.Object({
    totalCapsuls: t.Number(),
    shared: t.Number(),
    dayStreak: t.Number(),
    wordsWritten: t.Number()
  })
} as const;

export type MemoriesModel = {
  [k in keyof typeof MemoriesModel]: UnwrapSchema<(typeof MemoriesModel)[k]>;
};
