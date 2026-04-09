import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import { ContributionsService } from "./service";
import { ContributionsModel } from "./model";

export const contributionsController = new Elysia({
  prefix: "/memories/:memoryId/contributions",
  tags: ["Contribution"]
})
  .use(authPlugin)
  .get("/", ({ params }) => ContributionsService.listByMemory(params.memoryId))
  .post(
    "/",
    ({ params, body, user }) =>
      ContributionsService.add(params.memoryId, body, user?.sub),
    { body: ContributionsModel.addBody }
  )
  .guard(
    {
      beforeHandle: ({ user, status }) => {
        if (!user) return status(401, { message: "Unauthorized" });
      }
    },
    (app) =>
      app.delete("/:id", ({ params, user }) =>
        ContributionsService.remove(params.id, user!.sub)
      )
  );
