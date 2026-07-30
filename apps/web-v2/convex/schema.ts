import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
	topics: defineTable({
		title: v.string(),
		description: v.string(),
	}),
})
