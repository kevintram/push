import { v } from 'convex/values'

import { query } from './_generated/server'

export const getIdentity = query({
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
