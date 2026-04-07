import { db } from '../../db'
import type { TLoginBody } from './auth.types'
import type { User } from '../../../generated/prisma/client'

export class AuthService {
	async validateCredentials(body: TLoginBody): Promise<User | null> {
		const user = await db.user.findUnique({ where: { email: body.email } })
		if (!user) return null
		const valid = await Bun.password.verify(body.password, user.passwordHash)
		return valid ? user : null
	}

	async createSession(userId: string, token: string, expiresAt: Date): Promise<void> {
		await db.session.create({ data: { userId, token, expiresAt } })
	}

	async revokeSession(token: string): Promise<void> {
		await db.session.deleteMany({ where: { token } })
	}
}

export const authService = new AuthService()
