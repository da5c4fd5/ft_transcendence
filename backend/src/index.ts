import { Elysia } from 'elysia'
import { errorHandlerPlugin } from './plugins/error-handler.plugin'
import { authController } from './modules/auth/auth.controller'
import { usersController } from './modules/users/users.controller'
import { friendsController } from './modules/friends/friends.controller'
import { memoriesController } from './modules/memories/memories.controller'
import { contributionsController } from './modules/contributions/contributions.controller'

const app = new Elysia()
	.use(errorHandlerPlugin)
	.use(authController)
	.use(usersController)
	.use(friendsController)
	.use(memoriesController)
	.use(contributionsController)
	.get('/', () => ({ status: 'ok' }))
	.listen(3000)

console.log(`API running at http://${app.server?.hostname}:${app.server?.port}`)
