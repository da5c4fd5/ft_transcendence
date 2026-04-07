import { jwt } from '@elysiajs/jwt'

export const jwtPlugin = jwt({
	name: 'jwt',
	secret: process.env.JWT_SECRET ?? 'change-me-in-production',
	exp: '7d',
})
