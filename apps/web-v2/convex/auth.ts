import { v } from 'convex/values'

import { type MutationCtx, query, type QueryCtx } from './_generated/server'

export const verifyIdentity = query({
	args: {},
	returns: v.object({
		authenticated: v.boolean(),
	}),
	handler: async ctx => {
		const identity = await ctx.auth.getUserIdentity()

		if (identity === null) {
			throw new Error('Not authenticated')
		}

		return {
			authenticated: true,
		}
	},
})

export async function requireIdentity(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity()

	if (!identity) {
		throw new Error('Unauthenticated')
	}

	return identity
}
