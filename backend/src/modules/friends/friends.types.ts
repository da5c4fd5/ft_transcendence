import { t } from 'elysia'

export const AddFriendBody = t.Object({
	userId: t.String(),
})

export type TAddFriendBody = typeof AddFriendBody.static
