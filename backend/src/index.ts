import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { errorHandlerPlugin } from "./plugins/error-handler.plugin";
import { auth } from "./modules/auth";
import { users } from "./modules/users";
import { friends } from "./modules/friends";
import { memories } from "./modules/memories";
import { contributions } from "./modules/contributions";
import { admin } from "./modules/admin";

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
      origin:
        process.env.PROD === "true"
          ? "transcen.dence.fr"
          : ["transcen.dence.fr", "localhost:6767", "127.0.0.1:6767"]
    })
  )
  .onBeforeHandle(({ request, status }) => {
    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      const contentType = request.headers.get("content-type") ?? "";
      if (
        contentType !== "" &&
        !contentType.startsWith("application/json") &&
        !contentType.startsWith("multipart/form-data")
      ) {
        return status(415, { error: "Content-Type must be application/json" });
      }
    }
  })
  .use(errorHandlerPlugin)
  .use(auth)
  .use(users)
  .use(friends)
  .use(memories)
  .use(contributions)
  .use(admin)
  .get("/", () => ({ status: "ok" }), { detail: { hide: true } })
  .get(
    "/media/:filename",
    async ({ params }: { params: { filename: string } }) => {
      const { filename } = params;
      if (filename.includes("/") || filename.includes("..")) {
        return new Response(JSON.stringify({ error: "Invalid filename" }), { status: 400 });
      }
      const file = Bun.file(`/app/uploads/${filename}`);
      if (!(await file.exists())) {
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
      }
      return new Response(file);
    },
    { detail: { hide: true } }
  )
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: { title: "Capsul API Docs", version: "0.0.1" },
        servers: [{ url: "/api", description: "API server (proxied via Nginx)" }],
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
