import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import { UsersService } from "./service";
import { UsersModel } from "./model";

export const users = new Elysia({
  prefix: "/users",
  detail: {
    tags: ["User"],
    security: [
      {
        bearerAuth: []
      }
    ]
  }
})
  .use(authPlugin)
  .guard(
    {
      beforeHandle: ({ user, status }) => {
        if (!user) return status(401, { message: "Unauthorized" });
      }
    },
    (app) =>
      app
        .get("/me", ({ user }) => UsersService.findById(user!.sub))
        .get("/me/stats", ({ user }) => UsersService.getStats(user!.sub))
        .get(
          "/search",
          ({ user, query }) => UsersService.search(query.q ?? "", user!.sub),
          { query: t.Object({ q: t.Optional(t.String()) }) }
        )
        .get("/:id", ({ params }) => UsersService.findById(params.id))
        .patch(
          "/me",
          ({ user, body }) => UsersService.updateProfile(user!.sub, body),
          {
            body: UsersModel.updateProfileBody
          }
        )
        .patch(
          "/me/password",
          ({ user, body }) => UsersService.changePassword(user!.sub, body),
          {
            body: UsersModel.changePasswordBody,
            response: {
              200: UsersModel.changePasswordResponse,
              400: UsersModel.changePasswordSame,
              401: UsersModel.changePasswordInvalid
            }
          }
        )
        .patch(
          "/me/email",
          ({ user, body }) => UsersService.changeEmail(user!.sub, body),
          { body: UsersModel.changeEmailBody }
        )
        .post(
          "/me/avatar",
          ({ user, body }) => UsersService.uploadAvatar(user!.sub, body.file),
          { body: UsersModel.avatarBody }
        )
        .patch(
          "/me/notifications",
          ({ user, body }) =>
            UsersService.updateNotificationSettings(user!.sub, body),
          { body: UsersModel.notificationSettingsBody }
        )
        .get("/me/tree", ({ user }) => UsersService.getTree(user!.sub))
        .patch(
          "/me/tree",
          ({ user, body }) => UsersService.updateTree(user!.sub, body),
          { body: UsersModel.treeBody }
        )
  );
