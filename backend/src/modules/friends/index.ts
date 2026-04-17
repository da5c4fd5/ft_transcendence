import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import { FriendsService } from "./service";

export const friends = new Elysia({
  prefix: "/friends",
  detail: {
    tags: ["Friends"],
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
        .get("/", ({ user }) => FriendsService.list(user!.id), {
          detail: { description: "List accepted friends." }
        })
        .get("/requests", ({ user }) => FriendsService.listRequests(user!.id), {
          detail: { description: "List incoming pending friend requests." }
        })
        .put(
          "/:userId",
          ({ user, params }) => FriendsService.add(user!.id, params.userId),
          {
            detail: {
              description:
                "Send a friend request, or accept one if a pending request already exists from the other user."
            }
          }
        )
        .delete(
          "/:userId",
          async ({ user, params }) => {
            await FriendsService.remove(user!.id, params.userId);
            return new Response(null, { status: 204 });
          },
          {
            response: { 204: t.Any() },
            detail: {
              description: "Remove a friend or cancel/reject a pending request."
            }
          }
        )
  );
