import type { MutationCtx, QueryCtx } from '../_generated/server'

export async function requireIdentity(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity()

	if (!identity) {
		throw new Error('Unauthenticated')
	}

	return identity
}
