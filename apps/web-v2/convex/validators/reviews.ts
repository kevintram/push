import { v } from 'convex/values'

export const reviewBase = v.object({
	rating: v.union(
		v.literal('miss'),
		v.literal('hard'),
		v.literal('good'),
		v.literal('easy'),
	),
	description: v.string(),
	notes: v.string(),
	date: v.number(),
	ownerId: v.string(),
	reviewCardId: v.id('reviewCards')
})
