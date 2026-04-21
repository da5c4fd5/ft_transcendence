import { t, type UnwrapSchema } from "elysia";

const NullableString = t.Union([t.String(), t.Null()]);

// No request body schemas needed — friend routes use path params only.
// Keeping this file for consistency and future additions (e.g. pagination).
export const FriendsModel = {
  friendUserResponse: t.Object({
    id: t.String(),
    username: t.String(),
    avatarUrl: NullableString,
    online: t.Boolean()
  }),

  friendListItemResponse: t.Object({
    id: t.String(),
    requesterId: t.String(),
    recipientId: t.String(),
    requester: t.Object({
      id: t.String(),
      username: t.String(),
      avatarUrl: NullableString,
      online: t.Boolean()
    }),
    recipient: t.Object({
      id: t.String(),
      username: t.String(),
      avatarUrl: NullableString,
      online: t.Boolean()
    })
  }),

  friendRequestResponse: t.Object({
    id: t.String(),
    requesterId: t.String(),
    requester: t.Object({
      id: t.String(),
      username: t.String(),
      avatarUrl: NullableString
    })
  })
} as const;

export type FriendsModel = {
  [k in keyof typeof FriendsModel]: UnwrapSchema<(typeof FriendsModel)[k]>;
};
