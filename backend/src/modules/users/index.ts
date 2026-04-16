import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import { UsersService } from "./service";
import { UsersModel } from "./model";

export const users = new Elysia({
  prefix: "/users",
  detail: {
    tags: ["User"],
    security: [{ bearerAuth: [] }]
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
        // ── Profile ──────────────────────────────────────────────────
        .get("/me", ({ user }) => UsersService.findById(user!.id), {
          detail: { description: "Return the authenticated user's profile." }
        })
        .get("/:id", ({ params }) => UsersService.findById(params.id), {
          detail: { description: "Return a public profile by user ID." }
        })
        .get(
          "/search",
          ({ query }) => UsersService.findByUsername(query.q),
          {
            query: t.Object({ q: t.String() }),
            detail: {
              description:
                "Search users by username prefix. Returns up to 10 matches with id, username, and avatarUrl."
            }
          }
        )
        .patch(
          "/me",
          ({ user, body }) => UsersService.updateProfile(user!.id, body),
          {
            body: UsersModel.updateProfileBody,
            detail: {
              description:
                "Update username, displayName, or bio for the authenticated user."
            }
          }
        )

        // ── Password / Email ──────────────────────────────────────────
        .patch(
          "/me/password",
          ({ user, body }) => UsersService.changePassword(user!.id, body),
          {
            body: UsersModel.changePasswordBody,
            response: {
              200: UsersModel.changePasswordResponse,
              400: UsersModel.changePasswordSame,
              401: UsersModel.changePasswordInvalid
            },
            detail: {
              description:
                "Change the account password. Requires the current password."
            }
          }
        )
        .patch(
          "/me/email",
          ({ user, body }) => UsersService.changeEmail(user!.id, body),
          {
            body: UsersModel.changeEmailBody,
            detail: {
              description:
                "Change the account email. Requires the current password for confirmation."
            }
          }
        )

        // ── Avatar ────────────────────────────────────────────────────
        .post(
          "/me/avatar",
          ({ user, body }) => UsersService.uploadAvatar(user!.id, body.file),
          {
            body: UsersModel.avatarBody,
            detail: {
              description:
                "Upload a new avatar image (multipart/form-data). Returns the updated user profile."
            }
          }
        )

        // ── Notifications ─────────────────────────────────────────────
        .patch(
          "/me/notifications",
          ({ user, body }) =>
            UsersService.updateNotificationSettings(user!.id, body),
          {
            body: UsersModel.notificationSettingsBody,
            detail: {
              description: "Update notification preferences."
            }
          }
        )

        // ── Tree ──────────────────────────────────────────────────────
        .get("/me/tree", ({ user }) => UsersService.getTree(user!.id), {
          detail: { description: "Return the gamification tree state." }
        })
        .patch(
          "/me/tree",
          ({ user, body }) => UsersService.updateTree(user!.id, body),
          {
            body: UsersModel.treeBody,
            detail: { description: "Persist an updated tree state." }
          }
        )

        // ── MFA ───────────────────────────────────────────────────────
        .post(
          "/me/mfa",
          ({ user }) => UsersService.setupMfa(user!.id, user!.email),
          {
            response: { 200: UsersModel.mfaSetupResponse },
            detail: {
              description:
                "Begin TOTP MFA setup. Returns a Base32 secret and a QR-code data URI. The secret is stored as pending until confirmed with POST /users/me/mfa/verify. Any previous pending setup is overwritten."
            }
          }
        )
        .post(
          "/me/mfa/verify",
          ({ user, body }) => UsersService.verifyMfaSetup(user!.id, body),
          {
            body: UsersModel.mfaVerifyBody,
            response: { 204: t.Any(), 400: t.Any(), 422: t.Any() },
            detail: {
              description:
                "Confirm MFA setup by submitting a valid TOTP code. Activates MFA on the account."
            }
          }
        )
        .delete(
          "/me/mfa",
          ({ user, body }) => UsersService.disableMfa(user!.id, body),
          {
            body: UsersModel.mfaDisableBody,
            response: { 204: t.Any(), 400: t.Any(), 401: t.Any(), 422: t.Any() },
            detail: {
              description:
                "Disable MFA. Requires both the current password and a valid TOTP code."
            }
          }
        )

        // ── Achievements ──────────────────────────────────────────────
        .get(
          "/me/achievements",
          ({ user }) => UsersService.getAchievements(user!.id),
          {
            response: { 200: t.Array(t.String()) },
            detail: {
              description:
                "Return an array of unlocked achievement IDs for the current user. Labels, emojis, and descriptions are defined on the frontend."
            }
          }
        )
  );
