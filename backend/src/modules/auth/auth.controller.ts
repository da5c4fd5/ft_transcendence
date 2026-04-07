import { Elysia } from 'elysia'
import { jwtPlugin } from '../../plugins/jwt.plugin'
import { authPlugin } from '../../plugins/auth.plugin'
import { authService } from './auth.service'
import { LoginBody } from './auth.types'
import { CreateUserBody } from '../users/users.types'
import { db } from '../../db'
import { UsersService } from '../users/users.service'

const usersService = new UsersService(db)
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

export const authController = new Elysia({ prefix: '/auth' })
	.use(jwtPlugin)
	.use(authPlugin)
	.post(
		'/signup',
		({ body }) => usersService.create(body),
		{ body: CreateUserBody },
	)
	.post(
		'/login',
		async ({ body, jwt, status }) => {
			const user = await authService.validateCredentials(body)
			if (!user) return status(401, { message: 'Invalid credentials' })

			const token = await jwt.sign({ sub: user.id, email: user.email })
			await authService.createSession(user.id, token, new Date(Date.now() + TOKEN_TTL_MS))

			return { token }
		},
		{ body: LoginBody },
	)
	.guard(
		{
			beforeHandle: ({ user, status }) => {
				if (!user) return status(401, { message: 'Unauthorized' })
			},
		},
		(app) =>
			app.post('/logout', async ({ cookie, headers }) => {
				const cookieVal = cookie.session?.value
				const token =
					(typeof cookieVal === 'string' ? cookieVal : undefined) ??
					headers.authorization?.replace('Bearer ', '') ??
					''
				await authService.revokeSession(token)
				return { message: 'Logged out' }
			}),
	)
