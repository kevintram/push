import { v } from 'convex/values'

import { internal } from './_generated/api'
import { internalMutation } from './_generated/server'
import * as Cards from './model/cards'
import * as Sections from './model/sections'

/**
 * Ranks every section and card created before ordering existed, keeping each
 * list's order, a page of collections per transaction. Run once per
 * deployment, then `rank` can become required:
 *
 *   npx convex run migrations:backfillRanks
 *   npx convex run --prod migrations:backfillRanks
 */
export const backfillRanks = internalMutation({
	args: {
		cursor: v.optional(v.string()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const page = await ctx.db
			.query('collections')
			.paginate({ cursor: args.cursor ?? null, numItems: 50 })

		for (const collection of page.page) {
			await Sections.backfillForCollection(ctx, collection._id)
			await Cards.backfillForCollection(ctx, collection._id)
		}

		if (!page.isDone) {
			await ctx.scheduler.runAfter(0, internal.migrations.backfillRanks, {
				cursor: page.continueCursor,
			})
		}
	},
})
