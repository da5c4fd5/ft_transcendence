import { Elysia, t } from "elysia";
import { jwtPlugin } from "../../plugins/jwt.plugin";
import { authPlugin } from "../../plugins/auth.plugin";
import { Auth } from "./service";
import { AuthModel } from "./model";

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "Strict" as const,
  path: "/"
};

export const auth = new Elysia({ prefix: "/auth", tags: ["Auth"] })
  .use(jwtPlugin)
  .use(authPlugin)
  .post(
    "/signup",
    async ({ body, jwt, cookie: { session }, request }) => {
      const ua = request.headers.get("user-agent") ?? undefined;
      const response = await Auth.signUp(body, (payload) => jwt.sign(payload), ua);
      session!.set({
        value: response.token,
        ...SESSION_COOKIE_OPTIONS
      });
      return response;
    },
    {
      body: AuthModel.signUpBody,
      response: {
        200: AuthModel.signUpResponse,
        409: AuthModel.signUpConflict,
        422: AuthModel.signUpWeakPassword
      },
      detail: {
        description:
          "Register a new account. The very first account is promoted to admin automatically. On success returns a session token."
      }
    }
  )
  .post(
    "/login",
    async ({ body, jwt, cookie: { session }, request }) => {
      const ua = request.headers.get("user-agent") ?? undefined;
      const response = await Auth.logIn(body, (payload) => jwt.sign(payload), ua);
      if ("token" in response) {
        session!.set({
          value: response.token,
          ...SESSION_COOKIE_OPTIONS
        });
      }
      return response;
    },
    {
      body: AuthModel.logInBody,
      response: {
        200: t.Union([AuthModel.logInResponse, AuthModel.logInMfaRequired]),
        401: AuthModel.logInInvalid
      },
      detail: {
        description:
          "Authenticate with email and password. Returns a session token directly, or `{ mfaRequired: true, mfaToken }` when the account has MFA enabled — in that case complete login via POST /auth/mfa."
      }
    }
  )
  .post(
    "/mfa",
    async ({ body, jwt, cookie: { session }, request }) => {
      const response = await Auth.verifyMfaLogin(
        body,
        (payload) => jwt.sign(payload),
        request.headers.get("user-agent") ?? undefined
      );
      session!.set({
        value: response.token,
        ...SESSION_COOKIE_OPTIONS
      });
      return response;
    },
    {
      body: AuthModel.mfaLoginBody,
      response: {
        200: AuthModel.logInResponse,
        401: AuthModel.mfaLoginInvalid
      },
      detail: {
        description:
          "Second step of MFA login. Exchange the pre-auth token from POST /auth/login together with a valid TOTP code for a full session token."
      }
    }
  )
  .post("/forgot-password", () => new Response(null, { status: 204 }), {
    body: AuthModel.forgotPasswordBody,
    response: { 204: t.Any() },
    detail: {
      description:
        "Request a password-reset email. Always returns 204 regardless of whether the address is registered, to prevent email enumeration."
    }
  })
  .guard(
    {
      beforeHandle: ({ user, status }) => {
        if (!user) return status("Unauthorized");
      },
      detail: { security: [{ bearerAuth: [] }] }
    },
    (app) =>
      app
        .post(
          "/logout",
          async ({ user, cookie: { session } }) => {
            const response = await Auth.revokeSession(user!.sessionId);
            session!.set({
              value: "",
              ...SESSION_COOKIE_OPTIONS,
              maxAge: 0
            });
            return response;
          },
          {
            response: { 401: t.Any(), 204: t.Any() },
            detail: { description: "Revoke the current session." }
          }
        )
        .get("/sessions", ({ user }) => Auth.listSessions(user!.id, user!.sessionId), {
          detail: {
            description: "List all active sessions for the current user."
          }
        })
        .delete(
          "/sessions/:id",
          ({ user, params }) =>
            Auth.revokeOtherSession(params.id, user!.id, user!.sessionId),
          {
            response: { 204: t.Any(), 400: t.Any(), 401: t.Any() },
            detail: {
              description:
                "Revoke a specific session except the current one. Use POST /auth/logout to revoke the active session."
            }
          }
        )
  );
