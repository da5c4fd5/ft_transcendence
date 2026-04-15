import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import { ContributionsService } from "./service";
import { ContributionsModel } from "./model";

export const contributions = new Elysia({
  prefix: "/memories/:memoryId/contributions",
  detail: {
    tags: ["Contribution"],
    security: [{ bearerAuth: [] }]
  }
})
  .use(authPlugin)
  .get("/", ({ params }) => ContributionsService.listByMemory(params.memoryId), {
    detail: {
      security: [],
      description: "List contributions for a memory. Public (the memory itself controls visibility via isOpen)."
    }
  })
  .post(
    "/",
    ({ params, body, user }) =>
      ContributionsService.add(params.memoryId, body, user?.id),
    {
      body: ContributionsModel.addBody,
      detail: {
        description:
          "Add a contribution to an open memory. Can be done as a guest (provide guestName) or as an authenticated user."
      }
    }
  )
  .guard(
    {
      beforeHandle: ({ user, status }) => {
        if (!user) return status(401, { message: "Unauthorized" });
      }
    },
    (app) =>
      app
        .patch(
          "/:id",
          ({ params, user, body }) =>
            ContributionsService.edit(params.id, user!.id, body),
          {
            body: ContributionsModel.editBody,
            detail: {
              description: "Edit a contribution. Only the original contributor can edit."
            }
          }
        )
        .delete(
          "/:id",
          ({ params, user }) =>
            ContributionsService.remove(params.id, user!.id),
          {
            response: { 204: t.Any(), 403: t.Any(), 404: t.Any() },
            detail: {
              description:
                "Delete a contribution. Allowed for the contributor or the memory owner."
            }
          }
        )
  );
