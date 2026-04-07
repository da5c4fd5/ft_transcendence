import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Database } from '../../db'
import type {
	TCreateUserBody,
	TUpdateProfileBody,
	TChangePasswordBody,
	TNotificationSettingsBody,
} from './users.types'

const AVATARS_DIR = join(import.meta.dir, '../../../public/avatars')

export class UsersService {
	constructor(private readonly db: Database) { }

	async create(body: TCreateUserBody) {
		const passwordHash = await Bun.password.hash(body.password)
		return this.db.user.create({
			data: { email: body.email, username: body.username, passwordHash },
			omit: { passwordHash: true },
		})
	}

	async findById(id: string) {
		return this.db.user.findUniqueOrThrow({
			where: { id },
			omit: { passwordHash: true },
		})
	}

	async updateProfile(id: string, data: TUpdateProfileBody) {
		return this.db.user.update({
			where: { id },
			data,
			omit: { passwordHash: true },
		})
	}

	async changePassword(id: string, data: TChangePasswordBody): Promise<{ message: string } | null> {
		const user = await this.db.user.findUniqueOrThrow({ where: { id } })
		const valid = await Bun.password.verify(data.currentPassword, user.passwordHash)
		if (!valid) return null

		const passwordHash = await Bun.password.hash(data.newPassword)
		await this.db.user.update({ where: { id }, data: { passwordHash } })
		return { message: 'Password updated' }
	}

	async uploadAvatar(id: string, file: File) {
		const ext = file.name.split('.').pop() ?? 'bin'
		const filename = `${crypto.randomUUID()}.${ext}`
		mkdirSync(AVATARS_DIR, { recursive: true })
		await Bun.write(join(AVATARS_DIR, filename), file)
		return this.db.user.update({
			where: { id },
			data: { avatarUrl: `/avatars/${filename}` },
			omit: { passwordHash: true },
		})
	}

	async updateNotificationSettings(id: string, settings: TNotificationSettingsBody) {
		return this.db.user.update({
			where: { id },
			data: { notificationSettings: settings },
			omit: { passwordHash: true },
		})
	}

	async getTree(id: string) {
		const { treeState } = await this.db.user.findUniqueOrThrow({
			where: { id },
			select: { treeState: true },
		})
		return treeState
	}

	async updateTree(id: string, data: unknown) {
		const { treeState } = await this.db.user.update({
			where: { id },
			data: { treeState: data as object },
			select: { treeState: true },
		})
		return treeState
	}
}
