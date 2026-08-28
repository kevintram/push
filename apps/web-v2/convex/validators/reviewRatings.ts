import { v } from 'convex/values'

export const rating = v.union(
	v.literal('miss'),
	v.literal('hard'),
	v.literal('good'),
	v.literal('easy'),
)
