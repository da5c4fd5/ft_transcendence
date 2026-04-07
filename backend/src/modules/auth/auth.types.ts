import { t } from 'elysia'

export const LoginBody = t.Object({
	email: t.String({ format: 'email' }),
	password: t.String({ minLength: 8 }),
})

export const TokenPayload = t.Object({
	sub: t.String(),
	email: t.String(),
	iat: t.Number(),
	exp: t.Number(),
})

export type TLoginBody = typeof LoginBody.static
export type TTokenPayload = typeof TokenPayload.static
