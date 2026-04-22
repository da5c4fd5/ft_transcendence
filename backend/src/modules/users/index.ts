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
        .get("/me", ({ user }) => UsersService.findSelfById(user!.id), {
          response: { 200: UsersModel.selfProfileResponse },
          detail: { description: "Return the authenticated user's profile." }
        })
        .get(
          "/search",
          ({ query }) => UsersService.findByUsername(query.q),
          {
            query: t.Object({ q: t.String() }),
            response: { 200: t.Array(UsersModel.searchResultResponse) },
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
            response: { 200: UsersModel.selfProfileResponse },
            detail: {
              description:
                "Update username or displayName for the authenticated user."
            }
          }
        )
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
            response: { 200: UsersModel.selfProfileResponse },
            detail: {
              description:
                "Change the account email. Requires the current password for confirmation and resets email verification when SMTP is configured."
            }
          }
        )
        .post(
          "/me/email/verify/resend",
          ({ user }) => UsersService.requestEmailVerification(user!.id),
          {
            response: { 200: UsersModel.emailVerificationRequestResponse },
            detail: {
              description:
                "Issue a fresh 6-digit email verification code for the authenticated user. If SMTP is not configured, email verification is treated as disabled."
            }
          }
        )
        .post(
          "/me/email/verify",
          ({ user, body }) =>
            UsersService.confirmEmailVerification(user!.id, body),
          {
            body: UsersModel.emailVerificationBody,
            response: { 200: UsersModel.selfProfileResponse },
            detail: {
              description:
                "Verify the authenticated user's email with a 6-digit code. If SMTP is not configured, the account is considered verified automatically."
            }
          }
        )
        .get(
          "/me/public-api-key",
          ({ user }) => UsersService.getPublicApiKey(user!.id),
          {
            response: { 200: UsersModel.publicApiKeyInfoResponse },
            detail: {
              description:
                "Return the authenticated user's public API key status and preview."
            }
          }
        )
        .post(
          "/me/public-api-key",
          ({ user }) => UsersService.issuePublicApiKey(user!.id),
          {
            response: { 200: UsersModel.publicApiKeyIssueResponse },
            detail: {
              description:
                "Generate a fresh public API key for the authenticated user. The raw key is only returned once."
            }
          }
        )
        .delete(
          "/me/public-api-key",
          ({ user }) => UsersService.revokePublicApiKey(user!.id),
          {
            response: { 204: t.Any() },
            detail: {
              description:
                "Revoke the authenticated user's public API key immediately."
            }
          }
        )
        .get(
          "/me/export",
          ({ user }) => UsersService.exportSelf(user!.id),
          {
            response: { 200: t.Any() },
            detail: {
              description:
                "Download a readable JSON export of the authenticated user's data and send a confirmation email."
            }
          }
        )
        .delete(
          "/me",
          ({ user, body }) => UsersService.deleteSelf(user!.id, body),
          {
            body: UsersModel.deleteAccountBody,
            response: {
              204: t.Any(),
              400: t.Union([
                UsersModel.deleteAccountInvalidConfirmation,
                UsersModel.deleteAccountLastAdmin
              ]),
              401: UsersModel.deleteAccountInvalidPassword
            },
            detail: {
              description:
                'Permanently delete the authenticated user account and all cascaded data. Requires the current password and the exact confirmation phrase "delete my account".'
            }
          }
        )
        .post(
          "/me/avatar",
          ({ user, body }) => UsersService.uploadAvatar(user!.id, body.file),
          {
            body: UsersModel.avatarBody,
            response: { 200: UsersModel.selfProfileResponse },
            detail: {
              description:
                "Upload a new avatar image (multipart/form-data). Returns the updated user profile."
            }
          }
        )
        .patch(
          "/me/notifications",
          ({ user, body }) =>
            UsersService.updateNotificationSettings(user!.id, body),
          {
            body: UsersModel.notificationSettingsBody,
            response: { 200: UsersModel.selfProfileResponse },
            detail: {
              description: "Update notification preferences."
            }
          }
        )
        .get("/me/tree", ({ user }) => UsersService.getTree(user!.id), {
          response: { 200: UsersModel.treeResponse },
          detail: {
            description:
              "Return the computed tree health, stage, and trend for the authenticated user."
          }
        })
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
        .get("/:id", ({ params }) => UsersService.findPublicById(params.id), {
          response: { 200: UsersModel.publicProfileResponse },
          detail: { description: "Return a public profile by user ID." }
        })
  );
