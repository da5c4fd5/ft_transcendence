import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import { ChatModel } from "./model";
import { ChatService } from "./service";

export const chat = new Elysia({
  prefix: "/chat",
  detail: {
    tags: ["Chat"],
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
        .get(
          "/:friendId/messages",
          ({ user, params, query }) =>
            ChatService.listMessages(user!.id, params.friendId, query),
          {
            query: ChatModel.messagesQuery,
            response: { 200: ChatModel.messagesResponse },
            detail: {
              description:
                "Return the message history between the authenticated user and an accepted friend."
            }
          }
        )
        .post(
          "/:friendId/messages",
          ({ user, params, body }) =>
            ChatService.sendMessage(user!.id, params.friendId, body),
          {
            body: ChatModel.sendMessageBody,
            response: { 200: ChatModel.messageResponse, 400: t.Any(), 403: t.Any() },
            detail: {
              description:
                "Send a direct message to an accepted friend."
            }
          }
        )
  );
