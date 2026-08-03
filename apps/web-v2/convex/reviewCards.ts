import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { requireIdentity } from './auth'
import { requireOwnedReviewCard } from './model/reviewCards'
import { requireOwnedTopic } from './model/topics'

export const listByTopic = query({
	args: {
		topicId: v.id('topics'),
	},
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		await requireOwnedTopic(ctx, args.topicId, userId)

		// A card always carries the owner of the topic it was created under, so
		// the topic check above is what authorizes this read. The `ownerId`
		// filter restates that invariant rather than trusting it, keeping this
		// consistent with `get`/`update`/`remove`, which check the card itself.
		return await ctx.db
			.query('reviewCards')
			.withIndex('by_topicId', q => q.eq('topicId', args.topicId))
			.filter(q => q.eq(q.field('ownerId'), userId))
			.collect()
	},
})

export const get = query({
	args: {
		reviewCardId: v.id('reviewCards'),
	},
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		const reviewCard = await ctx.db.get('reviewCards', args.reviewCardId)

		// Null rather than a throw: a card the caller cannot see is a 404 for
		// the route to render, not an error. Cards owned by someone else are
		// reported the same way so this does not leak their existence.
		if (!reviewCard || reviewCard.ownerId !== userId) {
			return null
		}

		return reviewCard
	},
})

export const create = mutation({
	args: {
		topicId: v.id('topics'),
		// Cards are created from an empty "add" button, so everything the user
		// eventually fills in is optional here.
		type: v.optional(
			v.union(v.literal('practice'), v.literal('flashcard')),
		),
		primaryText: v.optional(v.string()),
		secondaryText: v.optional(v.string()),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		await requireOwnedTopic(ctx, args.topicId, userId)

		return await ctx.db.insert('reviewCards', {
			topicId: args.topicId,
			ownerId: userId,
			type: args.type ?? 'flashcard',
			primaryText: args.primaryText ?? '',
			secondaryText: args.secondaryText ?? '',
			notes: args.notes ?? '',
		})
	},
})

export const update = mutation({
	args: {
		reviewCardId: v.id('reviewCards'),
		type: v.optional(
			v.union(v.literal('practice'), v.literal('flashcard')),
		),
		primaryText: v.optional(v.string()),
		secondaryText: v.optional(v.string()),
		notes: v.optional(v.string()),
		flaggedAt: v.optional(
			v.union(v.number(), v.null()), // callers pass null to unflag
		),
	},
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		await requireOwnedReviewCard(ctx, args.reviewCardId, userId)

		const { reviewCardId, flaggedAt, ...fields } = args

		await ctx.db.patch('reviewCards', reviewCardId, {
			...fields,
			// An omitted key leaves the flag alone. `null` clears it, which in
			// Convex means patching an explicit `undefined`.
			...(flaggedAt !== undefined && {
				flaggedAt: flaggedAt ?? undefined,
			}),
		})
	},
})

/* AKA delete (we don't use `delete` because it's a reserved JS keyword) */
export const remove = mutation({
	args: {
		reviewCardId: v.id('reviewCards'),
	},
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		const reviewCard = await requireOwnedReviewCard(
			ctx,
			args.reviewCardId,
			userId,
		)

		await ctx.db.delete('reviewCards', args.reviewCardId)

		// Returned so callers can navigate back to the card's topic.
		return reviewCard
	},
})
