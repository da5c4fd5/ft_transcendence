import { type UnwrapSchema } from "elysia";

// No request body schemas needed — friend routes use path params only.
// Keeping this file for consistency and future additions (e.g. pagination).
export const FriendsModel = {} as const;

export type FriendsModel = {
  [k in keyof typeof FriendsModel]: UnwrapSchema<(typeof FriendsModel)[k]>;
};
