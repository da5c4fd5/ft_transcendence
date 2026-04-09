import { Elysia } from "elysia";
import { errorHandlerPlugin } from "./plugins/error-handler.plugin";
import { enforceJsonPlugin } from "./plugins/enforce-json.plugin";
import { auth } from "./modules/auth";
import { users } from "./modules/users";
import { friendsController } from "./modules/friends";
import { memoriesController } from "./modules/memories";
import { contributionsController } from "./modules/contributions";
import swagger from "@elysiajs/swagger";
import cors from "@elysiajs/cors";

const app = new Elysia({
  serve: {
    hostname: "transcen.dence.fr"
  }
})
  .use(
    cors({
      methods: "GET, PUT, POST, PATCH, DELETE",
      allowedHeaders: ["Authorization", "Content-Type"],
      origin: "transcen.dence.fr"
    })
  )
  .onBeforeHandle(({ request, status }) => {
    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      const ct = request.headers.get("content-type") ?? "";
      if (!ct.startsWith("application/json")) {
        return status(415, { error: "Content-Type must be application/json" });
      }
    }
  })
  .use(errorHandlerPlugin)
  .use(auth)
  .use(users)
  .use(friendsController)
  .use(memoriesController)
  .use(contributionsController)
  .get("/", () => ({ status: "ok" }), { detail: { hide: true } })
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: { title: "Transcendence API Docs", version: "0.0.1" },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT"
            }
          }
        }
      }
    })
  )
  .listen(3000);

console.log(
  `API running at http://${app.server?.hostname}:${app.server?.port}`
);
