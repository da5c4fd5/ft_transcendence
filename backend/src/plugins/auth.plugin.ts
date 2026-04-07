import { Elysia } from 'elysia'
import { jwtPlugin } from './jwt.plugin'
import { db } from '../db'
import type { TTokenPayload } from '../modules/auth/auth.types'

// Named so Elysia deduplicates it when multiple controllers use it —
// the derive() hook runs only once per request regardless of how many
// controllers call .use(authPlugin).
export const authPlugin = new Elysia({ name: 'auth-plugin' })
	.use(jwtPlugin)
	.derive({ as: 'global' }, async ({ headers, cookie, jwt }) => {
		const cookieVal = cookie.session?.value
		const token: string | undefined =
			(typeof cookieVal === 'string' ? cookieVal : undefined) ??
			headers.authorization?.replace('Bearer ', '')

		if (!token) return { user: null }

		const payload = await jwt.verify(token)
		if (!payload || !payload.sub) return { user: null }

		const session = await db.session.findUnique({ where: { token } })
		if (!session || session.expiresAt < new Date()) return { user: null }

		return {
			user: {
				sub: payload.sub,
				email: payload['email'] as string,
				iat: payload.iat ?? 0,
				exp: payload.exp ?? 0,
			} satisfies TTokenPayload,
		}
	})
