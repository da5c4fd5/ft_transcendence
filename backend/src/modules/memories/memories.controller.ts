import { Elysia, t } from 'elysia'
import { authPlugin } from '../../plugins/auth.plugin'
import { MemoriesService } from './memories.service'
import { CreateMemoryBody, UpdateMemoryBody } from './memories.types'
import { Pagination } from '../../types/common'
import { db } from '../../db'

const memoriesService = new MemoriesService(db)

export const memoriesController = new Elysia({ prefix: '/memories' })
	.use(authPlugin)
	.decorate('memoriesService', memoriesService)
	// Public: prompt suggestions (no auth required)
	.get('/prompts', ({ memoriesService }) => memoriesService.getPromptSuggestions())
	// Protected
	.guard(
		{
			beforeHandle: ({ user, set }) => {
				if (!user) { set.status = 401; return { message: 'Unauthorized' } }
			},
		},
		(app) =>
			app
				.get(
					'/',
					({ user, query, memoriesService }) =>
						memoriesService.list(user!.sub, {
							page: Number(query.page ?? 1),
							limit: Number(query.limit ?? 20),
						}),
					{ query: Pagination },
				)
				.post(
					'/',
					({ user, body, memoriesService }) => memoriesService.create(user!.sub, body),
					{ body: CreateMemoryBody },
				)
				.get(
					'/:memoryId',
					({ user, params, memoriesService }) =>
						memoriesService.findById(params.memoryId, user!.sub),
				)
				.patch(
					'/:memoryId',
					({ user, params, body, memoriesService }) =>
						memoriesService.update(params.memoryId, user!.sub, body),
					{ body: UpdateMemoryBody },
				)
				.delete(
					'/:memoryId',
					({ user, params, memoriesService }) =>
						memoriesService.delete(params.memoryId, user!.sub),
				)
				.post(
					'/:memoryId/media',
					({ user, params, body, memoriesService }) =>
						memoriesService.attachMedia(params.memoryId, user!.sub, body.file),
					{ body: t.Object({ file: t.File({ type: 'image/*' }) }) },
				)
				.get(
					'/timeline',
					({ user, query, memoriesService }) =>
						memoriesService.getTimeline(user!.sub, {
							page: Number(query.page ?? 1),
							limit: Number(query.limit ?? 20),
						}),
					{ query: Pagination },
				)
				.get(
					'/calendar',
					({ user, memoriesService }) => memoriesService.getLifeCalendar(user!.sub),
				),
	)
