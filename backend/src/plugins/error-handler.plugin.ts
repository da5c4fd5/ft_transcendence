import { Elysia, status } from 'elysia'
import { Prisma } from '../../generated/prisma/client'

export const errorHandlerPlugin = new Elysia({ name: 'error-handler' })
	.onError(({ code, error }) => {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === 'P2025') return status(404, { message: 'Not found' })
			if (error.code === 'P2002') return status(409, { message: 'Already exists' })
		}

		switch (code) {
			case 'VALIDATION':
				return status(422, { message: error.message })
			case 'NOT_FOUND':
				return status(404, { message: 'Not found' })
			default:
				console.error(error)
				return status(500, { message: 'Internal server error' })
		}
	})
