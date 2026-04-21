import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import { MemoriesService } from "./service";
import { MemoriesModel } from "./model";
import { Pagination } from "../../types/common";

export const memories = new Elysia({
  prefix: "/memories",
  detail: {
    tags: ["Memory"],
    security: [{ bearerAuth: [] }]
  }
})
  .use(authPlugin)
  .get("/prompts", () => MemoriesService.getPromptSuggestions(), {
    detail: {
      security: [],
      description: "Return a list of writing prompt suggestions. Public."
    }
  })
  .get(
    "/shared/:memoryId/:shareToken",
    ({ params }) => MemoriesService.findByShareToken(params.memoryId, params.shareToken),
    {
      detail: {
        security: [],
        description:
          "Return a shared memory by its ID and share token. Public — no authentication required. Returns 404 if not found or token mismatch, 403 if not open."
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
        // ── Today ─────────────────────────────────────────────────────
        .get("/today", ({ user }) => MemoriesService.today(user!.id), {
          response: { 200: t.Any(), 404: t.Any() },
          detail: {
            description:
              "Return the authenticated user's memory for today, if one exists. 404 if none."
          }
        })

        // ── Collection ────────────────────────────────────────────────
        .get(
          "/",
          ({ user, query }) =>
            MemoriesService.list(user!.id, {
              page: Number(query.page ?? 1),
              limit: Number(query.limit ?? 20)
            }),
          {
            query: Pagination,
            detail: {
              description: "Paginated list of the authenticated user's memories."
            }
          }
        )
        .post("/", ({ user, body }) => MemoriesService.create(user!.id, body), {
          body: MemoriesModel.createBody,
          detail: { description: "Create a new memory." }
        })

        // ── Search / Stats / Capsuls ──────────────────────────────────
        .get(
          "/search",
          ({ user, query }) => MemoriesService.search(user!.id, query),
          {
            query: MemoriesModel.searchQuery,
            detail: {
              description:
                "Filter memories by mood, date range (after/before or period shorthand), and whether they are open for contributions."
            }
          }
        )
        .get("/stats", ({ user }) => MemoriesService.getStats(user!.id), {
          response: { 200: MemoriesModel.statsResponse },
          detail: {
            description:
              "Return aggregate stats: total memories, shared count, current day streak, and total words written."
          }
        })
        .get("/capsuls", ({ user }) => MemoriesService.getCapsuls(user!.id), {
          detail: {
            description:
              "Return 3 backend-selected memories spread across the user's history, suitable for the time-capsule view."
          }
        })

        // ── Timeline / Calendar ───────────────────────────────────────
        .get(
          "/timeline",
          ({ user, query }) =>
            MemoriesService.getTimeline(user!.id, {
              page: Number(query.page ?? 1),
              limit: Number(query.limit ?? 20)
            }),
          {
            query: Pagination,
            detail: {
              description:
                "Alias of GET /memories — returns memories in descending date order."
            }
          }
        )
        .get("/calendar", ({ user }) =>
          MemoriesService.getLifeCalendar(user!.id), {
          detail: {
            description:
              "Return the dates of all memories for rendering a life-calendar heatmap."
          }
        })

        // ── Single memory ─────────────────────────────────────────────
        .get("/:memoryId", ({ user, params }) =>
          MemoriesService.findById(params.memoryId, user!.id), {
          detail: {
            description:
              "Return a single memory. Open memories are readable by anyone; private ones require ownership."
          }
        })
        .patch(
          "/:memoryId",
          ({ user, params, body }) =>
            MemoriesService.update(params.memoryId, user!.id, body),
          {
            body: MemoriesModel.updateBody,
            response: { 403: t.Any(), 404: t.Any() },
            detail: {
              description:
                "Update a memory's content or mood. Only today's memory can be updated."
            }
          }
        )
        .delete(
          "/:memoryId",
          ({ user, params }) =>
            MemoriesService.delete(params.memoryId, user!.id),
          {
            response: { 204: t.Any(), 403: t.Any(), 404: t.Any() },
            detail: {
              description:
                "Delete a memory and all its media. Only today's memory can be deleted."
            }
          }
        )

        // ── Media ─────────────────────────────────────────────────────
        .post(
          "/:memoryId/media",
          ({ user, params, body }) =>
            MemoriesService.attachMedia(params.memoryId, user!.id, body.file),
          {
            body: MemoriesModel.mediaBody,
            detail: { description: "Attach a media file to a memory." }
          }
        )
        .delete(
          "/:memoryId/media",
          ({ user, params }) =>
            MemoriesService.deleteMedia(params.memoryId, user!.id),
          {
            response: { 204: t.Any(), 403: t.Any(), 404: t.Any() },
            detail: { description: "Remove all media from a memory." }
          }
        )
  );
