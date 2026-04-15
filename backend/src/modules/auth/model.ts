import { t, type UnwrapSchema } from "elysia";

export const AuthModel = {
  logInBody: t.Object({
    email: t.String({ format: "email" }),
    password: t.String({ minLength: 8 })
  }),
  /** Returned when MFA is not enabled. */
  logInResponse: t.Object({
    token: t.String()
  }),
  /** Returned instead of `token` when the account has MFA enabled. */
  logInMfaRequired: t.Object({
    mfaRequired: t.Literal(true),
    mfaToken: t.String({
      description:
        "Short-lived (5 min) pre-auth token. Pass it to POST /auth/mfa along with the TOTP code."
    })
  }),
  logInInvalid: t.Object({
    error: t.Literal("Invalid email or password")
  }),

  mfaLoginBody: t.Object({
    mfaToken: t.String({ description: "Pre-auth token from POST /auth/login" }),
    code: t.String({
      minLength: 6,
      maxLength: 6,
      description: "6-digit TOTP code from the authenticator app"
    })
  }),
  mfaLoginInvalid: t.Object({
    error: t.Literal("Invalid or expired MFA code")
  }),

  forgotPasswordBody: t.Object({
    email: t.String({ format: "email" })
  }),

  signUpBody: t.Object({
    email: t.String({ format: "email" }),
    password: t.String({ minLength: 8 }),
    username: t.String({
      minLength: 2,
      maxLength: 32,
      pattern: "[a-z0-9\\-]{2,32}"
    })
  }),
  signUpResponse: t.Object({
    token: t.String()
  }),
  signUpConflict: t.Object({
    error: t.Literal("Email already registered")
  }),

  revokeSessionResponse: t.Object({
    message: t.Literal("Logged out")
  }),

  userPayload: t.Object({
    id: t.String(),
    email: t.String(),
    isAdmin: t.Boolean(),
    sessionId: t.String()
  })
} as const;

export type AuthModel = {
  [k in keyof typeof AuthModel]: UnwrapSchema<(typeof AuthModel)[k]>;
};
