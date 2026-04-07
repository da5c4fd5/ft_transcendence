import { t } from 'elysia'

export const AddContributionBody = t.Object({
	content: t.String({ minLength: 1, maxLength: 2000 }),
	guestName: t.Optional(t.String({ maxLength: 64 })),
})

export type TAddContributionBody = typeof AddContributionBody.static
