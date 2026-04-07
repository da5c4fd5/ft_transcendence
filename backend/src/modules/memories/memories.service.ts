import type { Database } from '../../db'
import type { TCreateMemoryBody, TUpdateMemoryBody } from './memories.types'

export class MemoriesService {
	constructor(private readonly db: Database) { }

	async list(userId: string, query: { page: number; limit: number }) {
		// TODO: paginated list, newest first
		throw new Error('Not implemented')
	}

	async findById(id: string, userId: string) {
		// TODO: return memory if owned by userId (or open)
		throw new Error('Not implemented')
	}

	async create(userId: string, data: TCreateMemoryBody) {
		// TODO: insert memory row, trigger tree growth
		throw new Error('Not implemented')
	}

	async update(id: string, userId: string, data: TUpdateMemoryBody) {
		// TODO: update memory if owned by userId
		throw new Error('Not implemented')
	}

	async delete(id: string, userId: string) {
		// TODO: soft-delete or hard-delete memory
		throw new Error('Not implemented')
	}

	async attachMedia(id: string, userId: string, file: File) {
		// TODO: store file, insert media record linked to memory
		throw new Error('Not implemented')
	}

	async getPromptSuggestions() {
		// TODO: return a list of writing prompts (static or generated)
		return [
			'What made you smile today?',
			'Describe a moment you want to remember forever.',
			'What are you grateful for this week?',
		]
	}

	async getTimeline(userId: string, query: { page: number; limit: number }) {
		// TODO: chronological memory list for timeline view
		throw new Error('Not implemented')
	}

	async getLifeCalendar(userId: string) {
		// TODO: aggregate memory counts by week/month for calendar heatmap
		throw new Error('Not implemented')
	}
}
