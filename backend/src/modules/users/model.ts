import { t, type UnwrapSchema } from "elysia";

const NullableString = t.Union([t.String(), t.Null()]);

export const UsersModel = {
  notificationSettingsResponse: t.Object({
    emailDigest: t.Optional(t.Boolean()),
    pushEnabled: t.Optional(t.Boolean()),
    reminderTime: t.Optional(t.String())
  }),

  publicApiKeyInfoResponse: t.Object({
    enabled: t.Boolean(),
    preview: NullableString,
    createdAt: t.Union([t.String({ format: "date-time" }), t.Null()])
  }),

  selfProfileResponse: t.Object({
    id: t.String(),
    username: t.String(),
    email: t.String({ format: "email" }),
    emailVerified: t.Boolean(),
    displayName: NullableString,
    avatarUrl: NullableString,
    notificationSettings: t.Optional(
      t.Object({
        emailDigest: t.Optional(t.Boolean()),
        pushEnabled: t.Optional(t.Boolean()),
        reminderTime: t.Optional(t.String())
      })
    ),
    publicApi: t.Object({
      enabled: t.Boolean(),
      preview: NullableString,
      createdAt: t.Union([t.String({ format: "date-time" }), t.Null()])
    }),
    isAdmin: t.Boolean(),
    hasMfa: t.Boolean()
  }),

  publicProfileResponse: t.Object({
    id: t.String(),
    username: t.String(),
    displayName: NullableString,
    avatarUrl: NullableString
  }),

  searchResultResponse: t.Object({
    id: t.String(),
    username: t.String(),
    avatarUrl: NullableString
  }),

  updateProfileBody: t.Object({
    username: t.Optional(t.String({ minLength: 2, maxLength: 32 })),
    displayName: t.Optional(t.String({ maxLength: 64 }))
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

  deleteAccountBody: t.Object({
    password: t.String({ description: "Current account password" }),
    confirmation: t.String({
      description: 'Exact confirmation phrase: "delete my account"'
    })
  }),
  deleteAccountInvalidPassword: t.Object({
    error: t.Literal("Password is incorrect")
  }),
  deleteAccountInvalidConfirmation: t.Object({
    error: t.Literal("Confirmation phrase does not match")
  }),
  deleteAccountLastAdmin: t.Object({
    error: t.Literal("At least one admin must remain")
  }),

  changeEmailBody: t.Object({
    password: t.String(),
    email: t.String({ format: "email" })
  }),
  emailVerificationRequestResponse: t.Object({
    message: t.String()
  }),
  publicApiKeyIssueResponse: t.Object({
    key: t.String(),
    preview: t.String(),
    createdAt: t.String({ format: "date-time" })
  }),
  emailVerificationBody: t.Object({
    code: t.String({ minLength: 6, maxLength: 6 })
  }),

  notificationSettingsBody: t.Object({
    emailDigest: t.Optional(t.Boolean()),
    pushEnabled: t.Optional(t.Boolean()),
    reminderTime: t.Optional(t.String())
  }),

  avatarBody: t.Object({ file: t.File({ type: "image/*" }) }),
  treeResponse: t.Object({
    lifeForce: t.Number({ minimum: 0, maximum: 100 }),
    isDecreasing: t.Boolean(),
    stage: t.Number({ minimum: 1, maximum: 8 }),
    stageLabel: t.String(),
    lastMemoryDate: t.Union([t.String({ format: "date" }), t.Null()])
  }),

  // ── MFA ──────────────────────────────────────────────────────────
  mfaSetupResponse: t.Object({
    secret: t.String({
      description: "Base32 TOTP secret — store in the authenticator app."
    }),
    qrCode: t.String({
      description: "data:image/png;base64,… QR-code image for the TOTP URI."
    })
  }),
  mfaVerifyBody: t.Object({
    code: t.String({
      minLength: 6,
      maxLength: 6,
      description: "6-digit TOTP code from the authenticator app"
    })
  }),
  mfaDisableBody: t.Object({
    password: t.String({ description: "Current account password" }),
    code: t.String({
      minLength: 6,
      maxLength: 6,
      description: "Current TOTP code from the authenticator app"
    })
  })
} as const;

export type UsersModel = {
  [k in keyof typeof UsersModel]: UnwrapSchema<(typeof UsersModel)[k]>;
};
