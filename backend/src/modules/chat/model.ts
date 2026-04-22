import { t, type UnwrapSchema } from "elysia";

const MAX_CHAT_MESSAGE_LENGTH = 500;

export const ChatModel = {
  messageResponse: t.Object({
    id: t.String(),
    senderId: t.String(),
    recipientId: t.String(),
    content: t.String(),
    createdAt: t.String({ format: "date-time" }),
    readAt: t.Union([t.String({ format: "date-time" }), t.Null()])
  }),

  messagesResponse: t.Array(
    t.Object({
      id: t.String(),
      senderId: t.String(),
      recipientId: t.String(),
      content: t.String(),
      createdAt: t.String({ format: "date-time" }),
      readAt: t.Union([t.String({ format: "date-time" }), t.Null()])
    })
  ),

  sendMessageBody: t.Object({
    content: t.String({ minLength: 1, maxLength: MAX_CHAT_MESSAGE_LENGTH })
  }),

  messagesQuery: t.Object({
    limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 50 })),
    before: t.Optional(t.String({ format: "date-time" }))
  })
} as const;

export type ChatModel = {
  [k in keyof typeof ChatModel]: UnwrapSchema<(typeof ChatModel)[k]>;
};
