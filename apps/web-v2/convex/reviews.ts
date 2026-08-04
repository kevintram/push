import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { requireIdentity } from './model/auth'
import * as Reviews from './model/reviews'
import { reviewCreate, reviewRead } from './validators/reviews'

export const listByReviewCard = query({
	args: {
		reviewCardId: v.id('reviewCards'),
	},
	returns: v.array(reviewRead),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)
		return Reviews.listByReviewCard(ctx, args.reviewCardId, userId)
	},
})

export const get = query({
	args: {
		reviewId: v.id('reviews'),
	},
	returns: reviewRead,
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)
		return await Reviews.get(ctx, args.reviewId, userId)
	},
})

export const create = mutation({
	args: reviewCreate.fields,
	returns: v.id('reviews'),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)
		return await Reviews.create(ctx, userId, args)
	},
})
