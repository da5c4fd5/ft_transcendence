import { t, type UnwrapSchema } from "elysia";

export const AdminModel = {};

export type AdminModel = {
  [k in keyof typeof AdminModel]: UnwrapSchema<(typeof AdminModel)[k]>;
};
