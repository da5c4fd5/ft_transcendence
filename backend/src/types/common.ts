import { t } from 'elysia'

export const ApiError = t.Object({
	message: t.String(),
})

export const Pagination = t.Object({
	page: t.Optional(t.Number({ minimum: 1, default: 1 })),
	limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
})
