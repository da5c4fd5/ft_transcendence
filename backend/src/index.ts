import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { auth } from "./modules/auth";
import { contributionsController } from "./modules/contributions";
import { friendsController } from "./modules/friends";
import { memoriesController } from "./modules/memories";
import { users } from "./modules/users";
import { errorHandlerPlugin } from "./plugins/error-handler.plugin";

const hostname = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 4242);
const tlsCertFile = process.env.TLS_CERT_FILE;
const tlsKeyFile = process.env.TLS_KEY_FILE;
const tls =
  tlsCertFile && tlsKeyFile
    ? {
        cert: Bun.file(tlsCertFile),
        key: Bun.file(tlsKeyFile)
      }
    : undefined;

const app = new Elysia()
  .use(
    cors({
      methods: "GET, PUT, POST, PATCH, DELETE",
      allowedHeaders: ["Authorization", "Content-Type"],
      origin: "transcen.dence.fr"
    })
  )
  .onBeforeHandle(({ request, status }) => {
    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      const contentType = request.headers.get("content-type") ?? "";
      if (!contentType.startsWith("application/json")) {
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
        info: { title: "Capsul API Docs", version: "0.0.1" },
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
  .listen({
    hostname,
    port,
    ...(tls ? { tls } : {})
  });

const protocol = tls ? "https" : "http";
console.log(`API running at ${protocol}://${app.server?.hostname}:${app.server?.port}`);
