import { ConvexError } from 'convex/values'

import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import type {
	CollectionCreate,
	CollectionDetail,
	CollectionPatch,
	CollectionSearchResult,
} from '../validators/collections'

export async function requireUserOwns(
	ctx: QueryCtx,
	userId: string,
	collectionId: Id<'collections'>,
	notFoundMessage = 'Collection not found',
): Promise<Doc<'collections'>> {
	const collection = await ctx.db.get('collections', collectionId)

	if (!collection || collection.ownerId !== userId) {
		throw new ConvexError(notFoundMessage)
	}

	return collection
}

export async function list(
	ctx: QueryCtx,
	userId: string,
): Promise<Array<Doc<'collections'>>> {
	return await ctx.db
		.query('collections')
		.withIndex('by_ownerId', q => q.eq('ownerId', userId))
		.collect()
}

export async function listChildren(
	ctx: QueryCtx,
	userId: string,
	collectionId: Id<'collections'>,
): Promise<Array<Doc<'collections'>>> {
	await requireUserOwns(ctx, userId, collectionId)

	const children = await ctx.db
		.query('collections')
		.withIndex('by_parentId', q => q.eq('parentId', collectionId))
		.collect()

	// Children share their parent's owner given well-formed data. The check
	// keeps a malformed foreign child from leaking through an owned parent.
	return children.filter(child => child.ownerId === userId)
}

export async function get(
	ctx: QueryCtx,
	userId: string,
	collectionId: Id<'collections'>,
	expandPath: boolean,
): Promise<CollectionDetail> {
	const collection = await requireUserOwns(ctx, userId, collectionId)

	if (!expandPath) {
		return collection
	}

	const expandedPath = await Promise.all(
		collection.path.map(ancestorId =>
			ctx.db.get('collections', ancestorId),
		),
	)

	// Ancestors that do not resolve are dropped rather than thrown on, so a
	// torn read renders a shorter trail. The ownership check is redundant with
	// the one above given a well-formed `path`, but keeps the invariant local.
	return {
		...collection,
		path: expandedPath.filter(
			(doc): doc is Doc<'collections'> =>
				doc !== null && doc.ownerId === userId,
		),
	}
}

export async function getMany(
	ctx: QueryCtx,
	userId: string,
	collectionIds: ReadonlyArray<Id<'collections'>>,
): Promise<Array<Doc<'collections'>>> {
	const collections = await Promise.all(
		collectionIds.map(collectionId =>
			ctx.db.get('collections', collectionId),
		),
	)

	return collections.filter(
		(collection): collection is Doc<'collections'> =>
			collection !== null && collection.ownerId === userId,
	)
}

export async function create(
	ctx: MutationCtx,
	userId: string,
	fields: CollectionCreate,
): Promise<Id<'collections'>> {
	// Ownership only. A new collection has no descendants, so it cannot close a
	// cycle, and walking the parent's whole ancestor chain here would cost
	// O(depth) reads on every create to guard against corruption no API path
	// can produce: `path` is server-owned and mutations are transactional.
	const parent = fields.parentId
		? await requireUserOwns(
				ctx,
				userId,
				fields.parentId,
				'Parent collection not found',
			)
		: undefined

	const title = fields.title ?? ''
	const description = fields.description ?? ''

	return await ctx.db.insert('collections', {
		title,
		description,
		parentId: fields.parentId,
		ownerId: userId,
		path: parent ? [...parent.path, parent._id] : [],
		// Newline-separated so the last word of one field cannot fuse to the
		// first word of the next into a single bogus token. Nothing is
		// normalized: Convex tokenizes and case-folds while indexing.
		searchText: [title, description].filter(Boolean).join('\n'),
	})
}

export async function update(
	ctx: MutationCtx,
	userId: string,
	collectionId: Id<'collections'>,
	patch: CollectionPatch,
): Promise<void> {
	const collection = await requireUserOwns(ctx, userId, collectionId)
	const { parentId: requestedParentId, ...fields } = patch

	// An omitted key leaves the parent alone; `null` detaches the collection, which
	// in Convex means patching an explicit `undefined`.
	const parentChangeRequested = requestedParentId !== undefined
	const newParentId =
		requestedParentId === null ? undefined : requestedParentId
	const parentChanged =
		parentChangeRequested && newParentId !== collection.parentId
	let path = collection.path
	if (parentChanged && newParentId) {
		// get new path and check there are no cycle
		const parent = await requireUserOwns(
			ctx,
			userId,
			newParentId,
			'Parent collection not found',
		)

		if (newParentId === collectionId) {
			throw new ConvexError('A collection cannot be its own parent')
		}

		if (parent.path.includes(collectionId)) {
			throw new ConvexError(
				'A collection cannot be nested below one of its descendants',
			)
		}

		path = [...parent.path, parent._id]
	} else if (parentChanged) {
		// newParentId is null so the collection was detached and is now a root
		path = []
	}

	const title = fields.title ?? collection.title
	const description = fields.description ?? collection.description

	await ctx.db.patch('collections', collectionId, {
		...fields,
		...(parentChanged && { parentId: newParentId, path }),
		searchText: [title, description].filter(Boolean).join('\n'),
	} as Partial<Doc<'collections'>>)

	if (parentChanged) {
		await updateDescendantPathsOf(ctx, userId, { id: collectionId, path })
	}
}

/**
 * Recursively update child paths of `collection`
 */
async function updateDescendantPathsOf(
	ctx: MutationCtx,
	userId: string,
	collection: {
		id: Id<'collections'>
		path: ReadonlyArray<Id<'collections'>>
	},
): Promise<void> {
	// TODO(3): this could reach Convex's per-mutation read/write limits; cap depth
	// if collection trees get large.
	const childPath = [...collection.path, collection.id]
	const children = ctx.db
		.query('collections')
		.withIndex('by_parentId', q => q.eq('parentId', collection.id))

	for await (const child of children) {
		if (child.ownerId !== userId) {
			throw new Error('Unable to move children')
		}

		await ctx.db.patch('collections', child._id, { path: childPath })
		await updateDescendantPathsOf(ctx, userId, {
			id: child._id,
			path: childPath,
		})
	}
}

export async function search(
	ctx: QueryCtx,
	userId: string,
	rawQuery: string,
): Promise<Array<CollectionSearchResult>> {
	const query = rawQuery.trim()

	// Short-circuit rather than issue a search for the empty string, whose
	// behavior is unspecified and which can never produce a useful result.
	if (query === '') {
		return []
	}

	// TODO(2): paginate. This returns every match in one relevance-ordered
	// batch, which Convex caps at 1024 documents; past that, hits are dropped
	// with no signal to the caller. Switch to `.paginate()` and have the
	// dialog page as the user scrolls the expanded group.
	const hits = await ctx.db
		.query('collections')
		.withSearchIndex('by_searchText', q =>
			// The owner filter is the only thing keeping one user's documents
			// out of another's results. It is not an optimization.
			q.search('searchText', query).eq('ownerId', userId),
		)
		.collect()

	// Get all ancestors of hits so we can return paths in search results
	// TODO(3): lazy loads the path from client?
	const pathCollectionsById = new Map(hits.map(hit => [hit._id, hit]))
	const ancestorIds = [...new Set(hits.flatMap(hit => hit.path))].filter(
		ancestorId => !pathCollectionsById.has(ancestorId),
	)
	const ancestors = await getMany(ctx, userId, ancestorIds)
	for (const ancestor of ancestors) {
		pathCollectionsById.set(ancestor._id, ancestor)
	}

	return hits.map(hit => ({
		_id: hit._id,
		title: hit.title,
		description: hit.description,
		pathTitles: hit.path
			.map(ancestorId => pathCollectionsById.get(ancestorId)?.title)
			.filter((title): title is string => title !== undefined),
	}))
}
