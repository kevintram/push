import { v } from 'convex/values'

export const reviewBase = v.object({
	ownerId: v.string(),
	reviewCardId: v.id('reviewCards'),
	rating: v.optional(
		v.union(
			v.literal('miss'),
			v.literal('hard'),
			v.literal('good'),
			v.literal('easy'),
		),
	),
	description: v.string(),
	notes: v.string(),
	// Reviews can be unscheduled or incomplete. Date-only strings match the
	// calendar UI and avoid timezone shifts for a user's intended review day.
	// TODO(2): validate YYYY-MM-DD when review mutations are added.
	scheduledAt: v.optional(v.string()),
	completedAt: v.optional(v.string()),
})

export const reviewRead = reviewBase.extend({
	_id: v.id('reviews'),
	_creationTime: v.number(),
})

export const reviewCreate = reviewBase
	.omit('ownerId', 'reviewCardId')
	.partial()
	.extend({ reviewCardId: v.id('reviewCards') }) // require
