import type { Database } from '../../db'
import type { TAddContributionBody } from './contributions.types'

export class ContributionsService {
	constructor(private readonly db: Database) { }

	async listByMemory(memoryId: string) {
		// TODO: return all contributions for a given open memory
		throw new Error('Not implemented')
	}

	async add(memoryId: string, data: TAddContributionBody, contributorId?: string) {
		// TODO: insert contribution (contributorId null = guest)
		throw new Error('Not implemented')
	}

	async remove(id: string, requesterId: string) {
		// TODO: delete if requester is memory owner or contributor
		throw new Error('Not implemented')
	}
}
