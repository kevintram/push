import { type Infer, v } from 'convex/values'

export const topicBase = v.object({
	title: v.string(),
	description: v.string(),
	parentId: v.optional(v.id('topics')),
	ownerId: v.string(),
	// Derived from `title` and `description`. Server-owned: never settable by a
	// client, always recomputed alongside the fields it mirrors.
	searchText: v.string(),
})

export const topicRead = topicBase.extend({
	_id: v.id('topics'),
	_creationTime: v.number(),
})

// Topics are created from an empty "add" button, so everything the user
// eventually fills in is optional. `ownerId` comes from the caller's identity.
export const topicCreate = topicBase.omit('ownerId', 'searchText').partial()

// Keep `ownerId` unsettable,
// and modify `parentId` to be a three-state shape
// where 1. omit/undefined = leave alone 2. null = unset 3. id = reparent
export const topicPatch = topicBase
	.omit('ownerId', 'parentId', 'searchText')
	.partial()
	.extend({
		parentId: v.optional(v.union(v.id('topics'), v.null())),
	})

export type Topic = Infer<typeof topicRead>
export type TopicCreate = Infer<typeof topicCreate>
export type TopicPatch = Infer<typeof topicPatch>
