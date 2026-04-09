import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import { MemoriesService } from "./service";
import { MemoriesModel } from "./model";
import { Pagination } from "../../types/common";

export const memoriesController = new Elysia({
  prefix: "/memories",
  tags: ["Memory"]
})
  .use(authPlugin)
  .get("/prompts", () => MemoriesService.getPromptSuggestions())
  .guard(
    {
      beforeHandle: ({ user, status }) => {
        if (!user) return status(401, { message: "Unauthorized" });
      }
    },
    (app) =>
      app
        .get(
          "/",
          ({ user, query }) =>
            MemoriesService.list(user!.sub, {
              page: Number(query.page ?? 1),
              limit: Number(query.limit ?? 20)
            }),
          { query: Pagination }
        )
        .post(
          "/",
          ({ user, body }) => MemoriesService.create(user!.sub, body),
          { body: MemoriesModel.createBody }
        )
        .get(
          "/timeline",
          ({ user, query }) =>
            MemoriesService.getTimeline(user!.sub, {
              page: Number(query.page ?? 1),
              limit: Number(query.limit ?? 20)
            }),
          { query: Pagination }
        )
        .get("/calendar", ({ user }) =>
          MemoriesService.getLifeCalendar(user!.sub)
        )
        .get("/:memoryId", ({ user, params }) =>
          MemoriesService.findById(params.memoryId, user!.sub)
        )
        .patch(
          "/:memoryId",
          ({ user, params, body }) =>
            MemoriesService.update(params.memoryId, user!.sub, body),
          { body: MemoriesModel.updateBody }
        )
        .delete("/:memoryId", ({ user, params }) =>
          MemoriesService.delete(params.memoryId, user!.sub)
        )
        .post(
          "/:memoryId/media",
          ({ user, params, body }) =>
            MemoriesService.attachMedia(params.memoryId, user!.sub, body.file),
          { body: MemoriesModel.mediaBody }
        )
  );
