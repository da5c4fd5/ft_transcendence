import { t, type UnwrapSchema } from "elysia";

export const AuthModel = {
  logInBody: t.Object({
    email: t.String({ format: "email" }),
    password: t.String({ minLength: 8 })
  }),
  logInResponse: t.Object({
    token: t.String()
  }),
  logInInvalid: t.Object({
    error: t.Literal("Invalid email or password")
  }),

  signUpBody: t.Object({
    email: t.String({ format: "email" }),
    password: t.String({ minLength: 8 }),
    username: t.String({
      minLength: 2,
      maxLength: 32,
      pattern: "[a-z0-9\-]{2,32}"
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
    isAdmin: t.Number(),
    sessionId: t.String()
  })
} as const;

export type AuthModel = {
  [k in keyof typeof AuthModel]: UnwrapSchema<(typeof AuthModel)[k]>;
};
