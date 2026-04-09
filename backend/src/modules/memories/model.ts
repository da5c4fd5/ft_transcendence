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
  mediaBody: t.Object({ file: t.File({ type: "image/*" }) })
} as const;

export type MemoriesModel = {
  [k in keyof typeof MemoriesModel]: UnwrapSchema<(typeof MemoriesModel)[k]>;
};
