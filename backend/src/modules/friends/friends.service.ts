import type { Database } from '../../db'

export class FriendsService {
	constructor(private readonly db: Database) { }

	async list(userId: string) {
		// TODO: return friends with online status
		throw new Error('Not implemented')
	}

	async add(userId: string, targetUserId: string) {
		// TODO: insert friendship record (pending or direct based on your model)
		throw new Error('Not implemented')
	}

	async remove(userId: string, targetUserId: string) {
		// TODO: delete friendship record
		throw new Error('Not implemented')
	}
}
