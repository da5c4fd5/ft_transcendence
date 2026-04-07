import { Elysia, t } from 'elysia'
import { authPlugin } from '../../plugins/auth.plugin'
import { UsersService } from './users.service'
import {
	UpdateProfileBody,
	ChangePasswordBody,
	NotificationSettingsBody,
} from './users.types'
import { db } from '../../db'

const usersService = new UsersService(db)

export const usersController = new Elysia({ prefix: '/users' })
	.use(authPlugin)
	.decorate('usersService', usersService)
	// Protected
	.guard(
		{
			beforeHandle: ({ user, status }) => {
				if (!user) return status(401, { message: 'Unauthorized' })
			},
		},
		(app) =>
			app
				.get('/me', ({ user, usersService }) => usersService.findById(user!.sub))
				.patch(
					'/me',
					({ user, body, usersService }) => usersService.updateProfile(user!.sub, body),
					{ body: UpdateProfileBody },
				)
				.patch(
					'/me/password',
					async ({ user, body, usersService, status }) => {
						const result = await usersService.changePassword(user!.sub, body)
						if (!result) return status(422, { message: 'Current password is incorrect' })
						return result
					},
					{ body: ChangePasswordBody },
				)
				.post(
					'/me/avatar',
					({ user, body, usersService }) => usersService.uploadAvatar(user!.sub, body.file),
					{ body: t.Object({ file: t.File({ type: 'image/*' }) }) },
				)
				.patch(
					'/me/notifications',
					({ user, body, usersService }) =>
						usersService.updateNotificationSettings(user!.sub, body),
					{ body: NotificationSettingsBody },
				)
				.get('/me/tree', ({ user, usersService }) => usersService.getTree(user!.sub))
				.patch(
					'/me/tree',
					({ user, body, usersService }) => usersService.updateTree(user!.sub, body),
					{ body: t.Any() },
				),
	)
