import { t, type UnwrapSchema } from "elysia";

export const AdminModel = {
  statsResponse: t.Object({
    userCount: t.Number(),
    memoryCount: t.Number(),
    sessionCount: t.Number()
  }),

  updateUserBody: t.Object({
    isAdmin: t.Optional(t.Boolean()),
    username: t.Optional(t.String({ minLength: 2, maxLength: 32 })),
    displayName: t.Optional(t.String({ maxLength: 64 }))
  })
} as const;

export type AdminModel = {
  [k in keyof typeof AdminModel]: UnwrapSchema<(typeof AdminModel)[k]>;
};
