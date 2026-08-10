import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { requireIdentity } from './model/auth'
import * as Reviews from './model/reviews'
import { reviewCreate, reviewPatch, reviewRead } from './validators/reviews'

export const listByReviewCard = query({
	args: {
		reviewCardId: v.id('reviewCards'),
	},
	returns: v.array(reviewRead),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await Reviews.listByReviewCard(ctx, userId, args.reviewCardId)
	},
})

export const get = query({
	args: {
		reviewId: v.id('reviews'),
	},
	returns: reviewRead,
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await Reviews.get(ctx, userId, args.reviewId)
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

export const update = mutation({
	args: {
		reviewId: v.id('reviews'),
		...reviewPatch.fields,
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)
		const { reviewId, ...patch } = args

		await Reviews.update(ctx, userId, reviewId, patch)
	},
})

/* AKA delete (we don't use `delete` because it's a reserved JS keyword) */
export const remove = mutation({
	args: {
		reviewId: v.id('reviews'),
	},
	returns: reviewRead,
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await Reviews.remove(ctx, userId, args.reviewId)
	},
})
