import { t } from 'elysia'

export const CreateUserBody = t.Object({
	email: t.String({ format: 'email' }),
	password: t.String({ minLength: 8 }),
	username: t.String({ minLength: 2, maxLength: 32 }),
})

export const UpdateProfileBody = t.Object({
	username: t.Optional(t.String({ minLength: 2, maxLength: 32 })),
	displayName: t.Optional(t.String({ maxLength: 64 })),
	bio: t.Optional(t.String({ maxLength: 280 })),
})

export const ChangePasswordBody = t.Object({
	currentPassword: t.String(),
	newPassword: t.String({ minLength: 8 }),
})

export const NotificationSettingsBody = t.Object({
	emailDigest: t.Optional(t.Boolean()),
	pushEnabled: t.Optional(t.Boolean()),
	reminderTime: t.Optional(t.String()),
})

export type TCreateUserBody = typeof CreateUserBody.static
export type TUpdateProfileBody = typeof UpdateProfileBody.static
export type TChangePasswordBody = typeof ChangePasswordBody.static
export type TNotificationSettingsBody = typeof NotificationSettingsBody.static
