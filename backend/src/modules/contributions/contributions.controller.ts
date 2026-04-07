import { Elysia } from 'elysia'
import { authPlugin } from '../../plugins/auth.plugin'
import { ContributionsService } from './contributions.service'
import { AddContributionBody } from './contributions.types'
import { db } from '../../db'

const contributionsService = new ContributionsService(db)

// Contributions live under /memories/:memoryId/contributions
export const contributionsController = new Elysia({
	prefix: '/memories/:memoryId/contributions',
})
	.use(authPlugin)
	.decorate('contributionsService', contributionsService)
	// Public: list contributions and add as guest (open memories)
	.get(
		'/',
		({ params, contributionsService }) =>
			contributionsService.listByMemory(params.memoryId),
	)
	.post(
		'/',
		({ params, body, user, contributionsService }) =>
			contributionsService.add(params.memoryId, body, user?.sub),
		{ body: AddContributionBody },
	)
	// Protected: remove a contribution
	.guard(
		{
			beforeHandle: ({ user, set }) => {
				if (!user) { set.status = 401; return { message: 'Unauthorized' } }
			},
		},
		(app) =>
			app.delete(
				'/:id',
				({ params, user, contributionsService }) =>
					contributionsService.remove(params.id, user!.sub),
			),
	)
