import { v } from 'convex/values'

import { query } from './_generated/server'
import { requireIdentity } from './model/auth'
import * as Due from './model/due'
import { dueDate, dueEntry } from './validators/due'

export const listByDueDate = query({
	args: {
		dueDate,
	},
	returns: v.array(dueEntry),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await Due.listByDueDate(ctx, userId, args.dueDate)
	},
})
