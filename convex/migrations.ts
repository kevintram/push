import { v } from 'convex/values'

import { internal } from './_generated/api'
import { internalMutation } from './_generated/server'
import * as Cards from './model/cards'
import * as Sections from './model/sections'
import { updateCardSrs } from './model/srs/replay'

/**
 * Replays every card's full review history under the current scheduler
 * parameters, rewriting each review's derived SRS fields and the card's due
 * date. Run on the dev deployment after changing `REQUEST_RETENTION`:
 *
 *   npx convex run migrations:replayAllCardSrs
 *
 * Each page logs its cursor; pass it back to resume a run that stopped.
 */
export const replayAllCardSrs = internalMutation({
	args: {
		cursor: v.optional(v.string()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const page = await ctx.db
			.query('cards')
			.paginate({ cursor: args.cursor ?? null, numItems: 10 })

		for (const card of page.page) {
			try {
				// The empty string sorts before every isoDate, so this replays
				// the whole history from an empty card.
				await updateCardSrs(ctx, card, '')
			} catch (error) {
				// Replay throws before writing, so a bad card is left as it was.
				console.error(
					`replayAllCardSrs skipped card ${card._id}`,
					error,
				)
			}
		}

		console.log(`replayAllCardSrs next cursor: ${page.continueCursor}`)
		if (!page.isDone) {
			await ctx.scheduler.runAfter(
				0,
				internal.migrations.replayAllCardSrs,
				{ cursor: page.continueCursor },
			)
		}
	},
})

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

/**
 * Rewrites every card stored before every card became a flashcard: drops
 * `type` and renames `primaryText` and `secondaryText` to `prompt` and
 * `answer`, a page of cards per transaction. Run once per deployment, then
 * the schema can store `cardBase`:
 *
 *   npx convex run migrations:flashcardsOnly
 *   npx convex run --prod migrations:flashcardsOnly
 */
export const flashcardsOnly = internalMutation({
	args: {
		cursor: v.optional(v.string()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const page = await ctx.db
			.query('cards')
			.paginate({ cursor: args.cursor ?? null, numItems: 100 })

		for (const doc of page.page) {
			if (
				doc.type === undefined &&
				doc.primaryText === undefined &&
				doc.secondaryText === undefined
			) {
				continue
			}
			const { prompt, answer } = Cards.toCard(doc)
			// Clearing in Convex means patching an explicit `undefined`.
			await ctx.db.patch('cards', doc._id, {
				prompt,
				answer,
				type: undefined,
				primaryText: undefined,
				secondaryText: undefined,
			})
		}

		if (!page.isDone) {
			await ctx.scheduler.runAfter(
				0,
				internal.migrations.flashcardsOnly,
				{
					cursor: page.continueCursor,
				},
			)
		}
	},
})
