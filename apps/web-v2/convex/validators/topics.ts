import { v } from 'convex/values'

export const topicBase = v.object({
	title: v.string(),
	description: v.string(),
	parentId: v.optional(v.id('topics')),
	ownerId: v.string(),
})

export const topicRead = topicBase.extend({
	_id: v.id('topics'),
	_creationTime: v.number(),
})

// Topics are created from an empty "add" button, so everything the user
// eventually fills in is optional. `ownerId` comes from the caller's identity.
export const topicCreate = topicBase.omit('ownerId').partial()

// Keep `ownerId` unsettable,
// and modify `parentId` to be a three-state shape
// where 1. omit/undefined = leave alone 2. null = unset 3. id = reparent
export const topicPatch = topicBase
	.omit('ownerId', 'parentId')
	.partial()
	.extend({
		parentId: v.optional(v.union(v.id('topics'), v.null())),
	})
