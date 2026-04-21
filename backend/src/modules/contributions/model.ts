import { t, type UnwrapSchema } from "elysia";

export const ContributionsModel = {
  addBody: t.Object({
    content: t.String({ minLength: 1, maxLength: 2000 }),
    guestName: t.Optional(t.String({ maxLength: 64 })),
    guestAvatarUrl: t.Optional(t.String({ maxLength: 8_000_000 })),
    mediaUrl: t.Optional(t.String({ maxLength: 8_000_000 }))
  }),
  editBody: t.Object({
    content: t.String({ minLength: 1, maxLength: 2000 }),
    mediaUrl: t.Optional(t.String({ maxLength: 8_000_000 }))
  })
} as const;

export type ContributionsModel = {
  [k in keyof typeof ContributionsModel]: UnwrapSchema<
    (typeof ContributionsModel)[k]
  >;
};
