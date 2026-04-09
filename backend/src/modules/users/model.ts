import { t, type UnwrapSchema } from "elysia";

export const UsersModel = {
  updateProfileBody: t.Object({
    username: t.Optional(t.String({ minLength: 2, maxLength: 32 })),
    displayName: t.Optional(t.String({ maxLength: 64 })),
    bio: t.Optional(t.String({ maxLength: 280 }))
  }),

  changePasswordBody: t.Object({
    currentPassword: t.String(),
    newPassword: t.String({ minLength: 8 })
  }),
  changePasswordResponse: t.Object({
    message: t.Literal("Password updated")
  }),
  changePasswordInvalid: t.Object({
    error: t.Literal("Current password is incorrect")
  }),
  changePasswordSame: t.Object({
    error: t.Literal("New password cannot be old password")
  }),

  changeEmailBody: t.Object({
    password: t.String(),
    email: t.String({ format: "email" })
  }),

  notificationSettingsBody: t.Object({
    emailDigest: t.Optional(t.Boolean()),
    pushEnabled: t.Optional(t.Boolean()),
    reminderTime: t.Optional(t.String())
  }),

  avatarBody: t.Object({ file: t.File({ type: "image/*" }) }),
  treeBody: t.Any()
} as const;

export type UsersModel = {
  [k in keyof typeof UsersModel]: UnwrapSchema<(typeof UsersModel)[k]>;
};
