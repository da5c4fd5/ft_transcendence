import { t, type UnwrapSchema } from "elysia";

export const ContributionsModel = {
  addBody: t.Object({
    content: t.String({ minLength: 1, maxLength: 2000 }),
    guestName: t.Optional(t.String({ maxLength: 64 }))
  }),
  editBody: t.Object({
    content: t.String({ minLength: 1, maxLength: 2000 })
  })
} as const;

export type ContributionsModel = {
  [k in keyof typeof ContributionsModel]: UnwrapSchema<
    (typeof ContributionsModel)[k]
  >;
};
