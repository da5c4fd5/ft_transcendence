import { Elysia } from 'elysia'
import { authPlugin } from '../../plugins/auth.plugin'
import { FriendsService } from './friends.service'
import { AddFriendBody } from './friends.types'
import { db } from '../../db'

const friendsService = new FriendsService(db)

export const friendsController = new Elysia({ prefix: '/friends' })
	.use(authPlugin)
	.decorate('friendsService', friendsService)
	.guard(
		{
			beforeHandle: ({ user, set }) => {
				if (!user) { set.status = 401; return { message: 'Unauthorized' } }
			},
		},
		(app) =>
			app
				.get('/', ({ user, friendsService }) => friendsService.list(user!.sub))
				.post(
					'/',
					({ user, body, friendsService }) => friendsService.add(user!.sub, body.userId),
					{ body: AddFriendBody },
				)
				.delete(
					'/:userId',
					({ user, params, friendsService }) =>
						friendsService.remove(user!.sub, params.userId),
				),
	)
