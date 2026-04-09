import { Elysia } from "elysia";
import { jwtPlugin } from "../../plugins/jwt.plugin";
import { authPlugin } from "../../plugins/auth.plugin";
import { Auth } from "./service";
import { AuthModel } from "./model";

export const auth = new Elysia({ prefix: "/auth", tags: ["Auth"] })
  .use(jwtPlugin)
  .use(authPlugin)
  .post(
    "/signup",
    async ({ body, jwt, cookie: { session } }) => {
      const response = await Auth.signUp(body, (payload) => jwt.sign(payload));
      session!.value = response.token;
      return response;
    },
    {
      body: AuthModel.signUpBody,
      response: {
        200: AuthModel.signUpResponse,
        409: AuthModel.signUpConflict
      }
    }
  )
  .post(
    "/login",
    async ({ body, jwt, cookie: { session } }) => {
      const response = await Auth.logIn(body, (payload) => jwt.sign(payload));
      session!.value = response.token;
      return response;
    },
    {
      body: AuthModel.logInBody,
      response: {
        200: AuthModel.logInResponse,
        401: AuthModel.logInInvalid
      }
    }
  )
  .guard(
    {
      beforeHandle: ({ user, status }) => {
        if (!user) return status(401, { message: "Unauthorized" });
      },
    detail: { security: [{ bearerAuth: [] }] }
    },
    (app) =>
      app
        .post("/logout", async ({ user }) => Auth.revokeSession(user!.jti), {
          response: {
            200: AuthModel.revokeSessionResponse
          }
        })
        .get("/sessions", ({ user }) => Auth.listSessions(user!.sub))
  );
