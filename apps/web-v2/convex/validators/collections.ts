import { type Infer, v } from 'convex/values'

export const collectionBase = v.object({
	title: v.string(),
	description: v.string(),
	parentId: v.optional(v.id('collections')),
	ownerId: v.string(),
	// Derived from `title` and `description`. Server-owned: never settable by a
	// client, always recomputed alongside the fields it mirrors.
	searchText: v.string(),
	// The ancestor chain, root-first, excluding the collection itself: a root collection
	// has `path: []`. Derived from `parentId`. Server-owned: never settable by a
	// client, always recomputed alongside the reparenting that invalidates it.
	path: v.array(v.id('collections')),
})

export const collectionRead = collectionBase.extend({
	_id: v.id('collections'),
	_creationTime: v.number(),
})

export const collectionDetail = collectionRead.omit('path').extend({
	path: v.union(v.array(v.id('collections')), v.array(collectionRead)),
})

// Collections are created from an empty "add" button, so everything the user
// eventually fills in is optional. `ownerId` comes from the caller's identity.
export const collectionCreate = collectionBase
	.omit('ownerId', 'searchText', 'path')
	.partial()

// Keep `ownerId` unsettable,
// and modify `parentId` to be a three-state shape
// where 1. omit/undefined = leave alone 2. null = unset 3. id = reparent
export const collectionPatch = collectionBase
	.omit('ownerId', 'parentId', 'searchText', 'path')
	.partial()
	.extend({
		parentId: v.optional(v.union(v.id('collections'), v.null())),
	})

export const collectionSearchResult = v.object({
	_id: v.id('collections'),
	title: v.string(),
	description: v.string(),
	pathTitles: v.array(v.string()), // the titles of the collection's path
})

export type Collection = Infer<typeof collectionRead>
export type CollectionDetail = Infer<typeof collectionDetail>
export type CollectionCreate = Infer<typeof collectionCreate>
export type CollectionPatch = Infer<typeof collectionPatch>
export type CollectionSearchResult = Infer<typeof collectionSearchResult>
