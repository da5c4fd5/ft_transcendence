import { t } from 'elysia'

export const CreateMemoryBody = t.Object({
	content: t.String({ minLength: 1, maxLength: 2000 }),
	date: t.Optional(t.String({ format: 'date' })),
	mood: t.Optional(t.String({ maxLength: 32 })),
	isOpen: t.Optional(t.Boolean({ default: false })),
})

export const UpdateMemoryBody = t.Object({
	content: t.Optional(t.String({ minLength: 1, maxLength: 2000 })),
	mood: t.Optional(t.String({ maxLength: 32 })),
})

export type TCreateMemoryBody = typeof CreateMemoryBody.static
export type TUpdateMemoryBody = typeof UpdateMemoryBody.static
