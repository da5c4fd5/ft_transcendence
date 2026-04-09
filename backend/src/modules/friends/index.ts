import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import { FriendsService } from "./service";

export const friendsController = new Elysia({
  prefix: "/friends",
  tags: ["Friends"]
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
        .get("/", ({ user }) => FriendsService.list(user!.sub))
        .put("/:userId", ({ user, params }) =>
          FriendsService.add(user!.sub, params.userId)
        )
        .delete("/:userId", ({ user, params }) =>
          FriendsService.remove(user!.sub, params.userId)
        )
  );
