import { t, type UnwrapSchema } from "elysia";

export const AdminModel = {
  statsResponse: t.Object({
    userCount: t.Number(),
    memoryCount: t.Number(),
    sessionCount: t.Number()
  }),

  aiOverviewResponse: t.Object({
    promptSuggestions: t.Object({
      totalStoredPrompts: t.Number(),
      usersWithStoredPrompts: t.Number(),
      generationStatusCounts: t.Object({
        idle: t.Number(),
        generating: t.Number(),
        ready: t.Number(),
        error: t.Number()
      }),
      systemPrompts: t.Array(
        t.Object({
          model: t.String(),
          prompt: t.String(),
          usersCount: t.Number(),
          updatedAt: t.String()
        })
      ),
      recentErrors: t.Array(
        t.Object({
          userId: t.String(),
          username: t.String(),
          lastError: t.String(),
          updatedAt: t.String()
        })
      )
    }),
    moodClassification: t.Object({
      totalJobs: t.Number(),
      statusCounts: t.Object({
        queued: t.Number(),
        processing: t.Number(),
        completed: t.Number(),
        failed: t.Number()
      }),
      recentFailures: t.Array(
        t.Object({
          jobId: t.String(),
          memoryId: t.String(),
          userId: t.String(),
          username: t.String(),
          lastError: t.String(),
          updatedAt: t.String()
        })
      )
    })
  }),

  updateUserBody: t.Object({
    isAdmin: t.Optional(t.Boolean()),
    username: t.Optional(
      t.String({
        minLength: 2,
        maxLength: 32,
        pattern: "^[a-z0-9\\-]{2,32}$"
      })
    ),
    displayName: t.Optional(t.String({ maxLength: 64 }))
  }),

  createMemoryBody: t.Object({
    userId: t.String(),
    date: t.String({ format: "date" }),
    content: t.String({ minLength: 1, maxLength: 180 }),
    isOpen: t.Optional(t.Boolean())
  }),

  memoryMediaBody: t.Object({
    file: t.File()
  })
} as const;

export type AdminModel = {
  [k in keyof typeof AdminModel]: UnwrapSchema<(typeof AdminModel)[k]>;
};
