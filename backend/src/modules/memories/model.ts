import { t, type UnwrapSchema } from "elysia";

export const MemoriesModel = {
  createBody: t.Object({
    content: t.String({ minLength: 1, maxLength: 2000 }),
    date: t.Optional(t.String({ format: "date" })),
    mood: t.Optional(t.String({ maxLength: 32 })),
    isOpen: t.Optional(t.Boolean())
  }),
  updateBody: t.Object({
    content: t.Optional(t.String({ minLength: 1, maxLength: 2000 })),
    mood: t.Optional(t.String({ maxLength: 32 }))
  }),
  mediaBody: t.Object({ file: t.File({ type: "image/*" }) }),

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
