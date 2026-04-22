import { t, type UnwrapSchema } from "elysia";

const MAX_CONTRIBUTION_CONTENT_LENGTH = 180;
const MAX_INLINE_MEDIA_DATA_URL_LENGTH = 14_100_000;

export const ContributionsModel = {
  addBody: t.Object({
    content: t.String({
      minLength: 1,
      maxLength: MAX_CONTRIBUTION_CONTENT_LENGTH
    }),
    guestName: t.Optional(t.String({ maxLength: 64 })),
    guestAvatarUrl: t.Optional(
      t.String({ maxLength: MAX_INLINE_MEDIA_DATA_URL_LENGTH })
    ),
    mediaUrl: t.Optional(t.String({ maxLength: MAX_INLINE_MEDIA_DATA_URL_LENGTH }))
  }),
  editBody: t.Object({
    content: t.String({
      minLength: 1,
      maxLength: MAX_CONTRIBUTION_CONTENT_LENGTH
    }),
    mediaUrl: t.Optional(t.String({ maxLength: MAX_INLINE_MEDIA_DATA_URL_LENGTH }))
  })
} as const;

export type ContributionsModel = {
  [k in keyof typeof ContributionsModel]: UnwrapSchema<
    (typeof ContributionsModel)[k]
  >;
};
