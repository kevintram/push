import { v } from 'convex/values'

import { query } from './_generated/server'
import { requireIdentity } from './model/auth'
import * as Due from './model/due'
import { dueEntry, dueFilters } from './validators/due'

export const list = query({
	args: dueFilters.fields,
	returns: v.array(dueEntry),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await Due.list(ctx, userId, args)
	},
})
