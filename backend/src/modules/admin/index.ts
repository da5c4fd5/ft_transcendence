import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import { AdminService } from "./service";
import { AdminModel } from "./model";
import { Pagination } from "../../types/common";

export const admin = new Elysia({
  prefix: "/admin",
  detail: {
    tags: ["Admin"],
    security: [{ bearerAuth: [] }]
  }
})
  .use(authPlugin)
  .guard(
    {
      beforeHandle: ({ user, status }) => {
        if (!user) return status(401, { message: "Unauthorized" });
        if (!user.isAdmin) return status(403, { message: "Forbidden" });
      }
    },
    (app) =>
      app
        .get("/stats", () => AdminService.getStats(), {
          response: { 200: AdminModel.statsResponse },
          detail: {
            description:
              "Return platform-wide counts: total users, memories, and active sessions."
          }
        })
        .get("/ai/stats", () => AdminService.getAiOverview(), {
          response: { 200: AdminModel.aiOverviewResponse },
          detail: {
            description:
              "Return global AI usage and health metrics for prompt generation and mood classification."
          }
        })
        .post(
          "/users/:id/reminder-email",
          ({ params }) => AdminService.sendManualReminderEmail(params.id),
          {
            response: { 200: AdminModel.manualReminderResponse },
            detail: {
              description:
                "Manually send a reminder email to a specific verified user, including AI prompt suggestions taken from that user's prompt queue."
            }
          }
        )
        .post("/memories", ({ body }) => AdminService.createMemory(body), {
          body: AdminModel.createMemoryBody,
          response: { 200: t.Any(), 404: t.Any(), 409: t.Any() },
          detail: {
            description:
              "Create a memory for any user on a specific date. Useful for admin backfilling or corrections."
          }
        })
        .post(
          "/memories/:memoryId/media",
          ({ params, body }) =>
            AdminService.attachMemoryMedia(params.memoryId, body.file),
          {
            body: AdminModel.memoryMediaBody,
            response: { 200: t.Any(), 404: t.Any() },
            detail: {
              description:
                "Attach an image or audio file to any memory as an admin, including backfilled memories."
            }
          }
        )
        .get(
          "/users",
          ({ query }) =>
            AdminService.listUsers(
              Number(query.page ?? 1),
              Number(query.limit ?? 20)
            ),
          {
            query: Pagination,
            detail: {
              description:
                "Paginated list of all users. Sensitive fields (password hash, MFA secrets) are omitted."
            }
          }
        )
        .patch(
          "/users/:id",
          ({ params, body }) => AdminService.updateUser(params.id, body),
          {
            body: AdminModel.updateUserBody,
            response: { 404: t.Any() },
            detail: {
              description:
                "Update a user's profile or admin status. Use `isAdmin: true/false` to promote/demote."
            }
          }
        )
        .delete(
          "/users/:id",
          ({ params }) => AdminService.deleteUser(params.id),
          {
            response: { 204: t.Any(), 404: t.Any() },
            detail: {
              description:
                "Permanently delete a user and all their data (cascade). Returns 204 on success."
            }
          }
        )
  );
