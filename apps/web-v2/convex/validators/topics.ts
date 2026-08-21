import { type Infer, v } from 'convex/values'

export const topicBase = v.object({
	title: v.string(),
	description: v.string(),
	parentId: v.optional(v.id('topics')),
	ownerId: v.string(),
	// Derived from `title` and `description`. Server-owned: never settable by a
	// client, always recomputed alongside the fields it mirrors.
	searchText: v.string(),
	// The ancestor chain, root-first, excluding the topic itself: a root topic
	// has `path: []`. Derived from `parentId`. Server-owned: never settable by a
	// client, always recomputed alongside the reparenting that invalidates it.
	path: v.array(v.id('topics')),
})

export const topicRead = topicBase.extend({
	_id: v.id('topics'),
	_creationTime: v.number(),
})

export const topicDetail = topicRead.omit('path').extend({
	path: v.union(v.array(v.id('topics')), v.array(topicRead)),
})

// Topics are created from an empty "add" button, so everything the user
// eventually fills in is optional. `ownerId` comes from the caller's identity.
export const topicCreate = topicBase
	.omit('ownerId', 'searchText', 'path')
	.partial()

// Keep `ownerId` unsettable,
// and modify `parentId` to be a three-state shape
// where 1. omit/undefined = leave alone 2. null = unset 3. id = reparent
export const topicPatch = topicBase
	.omit('ownerId', 'parentId', 'searchText', 'path')
	.partial()
	.extend({
		parentId: v.optional(v.union(v.id('topics'), v.null())),
	})

export const topicSearchResult = v.object({
	_id: v.id('topics'),
	title: v.string(),
	description: v.string(),
	pathTitles: v.array(v.string()), // the titles of the topic's path
})

export type Topic = Infer<typeof topicRead>
export type TopicDetail = Infer<typeof topicDetail>
export type TopicCreate = Infer<typeof topicCreate>
export type TopicPatch = Infer<typeof topicPatch>
export type TopicSearchResult = Infer<typeof topicSearchResult>
