import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import type { TopicCreate, TopicDetail, TopicPatch } from '../validators/topics'

export async function requireUserOwns(
	ctx: QueryCtx,
	userId: string,
	topicId: Id<'topics'>,
	notFoundMessage = 'Topic not found',
): Promise<Doc<'topics'>> {
	const topic = await ctx.db.get('topics', topicId)

	if (!topic || topic.ownerId !== userId) {
		throw new Error(notFoundMessage)
	}

	return topic
}

export async function list(
	ctx: QueryCtx,
	userId: string,
): Promise<Array<Doc<'topics'>>> {
	return await ctx.db
		.query('topics')
		.withIndex('by_ownerId', q => q.eq('ownerId', userId))
		.collect()
}

export async function get(
	ctx: QueryCtx,
	userId: string,
	topicId: Id<'topics'>,
	expandPath: boolean,
): Promise<TopicDetail> {
	const topic = await requireUserOwns(ctx, userId, topicId)

	if (!expandPath) {
		return topic
	}

	const expandedPath = await Promise.all(
		topic.path.map(ancestorId => ctx.db.get('topics', ancestorId)),
	)

	// Ancestors that do not resolve are dropped rather than thrown on, so a
	// torn read renders a shorter trail. The ownership check is redundant with
	// the one above given a well-formed `path`, but keeps the invariant local.
	return {
		...topic,
		path: expandedPath.filter(
			(doc): doc is Doc<'topics'> =>
				doc !== null && doc.ownerId === userId,
		),
	}
}

export async function create(
	ctx: MutationCtx,
	userId: string,
	fields: TopicCreate,
): Promise<Id<'topics'>> {
	// Ownership only. A new topic has no descendants, so it cannot close a
	// cycle, and walking the parent's whole ancestor chain here would cost
	// O(depth) reads on every create to guard against corruption no API path
	// can produce: `path` is server-owned and mutations are transactional.
	const parent = fields.parentId
		? await requireUserOwns(
				ctx,
				userId,
				fields.parentId,
				'Parent topic not found',
			)
		: undefined

	const title = fields.title ?? ''
	const description = fields.description ?? ''

	return await ctx.db.insert('topics', {
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
	topicId: Id<'topics'>,
	patch: TopicPatch,
): Promise<void> {
	const topic = await requireUserOwns(ctx, userId, topicId)
	const { parentId: requestedParentId, ...fields } = patch

	// An omitted key leaves the parent alone; `null` detaches the topic, which
	// in Convex means patching an explicit `undefined`.
	const parentChangeRequested = requestedParentId !== undefined
	const newParentId =
		requestedParentId === null ? undefined : requestedParentId
	const parentChanged =
		parentChangeRequested && newParentId !== topic.parentId
	let path = topic.path
	if (parentChanged && newParentId) {
		// get new path and check there are no cycle
		const parent = await requireUserOwns(
			ctx,
			userId,
			newParentId,
			'Parent topic not found',
		)

		if (newParentId === topicId) {
			throw new Error('A topic cannot be its own parent')
		}

		if (parent.path.includes(topicId)) {
			throw new Error(
				'A topic cannot be nested below one of its descendants',
			)
		}

		path = [...parent.path, parent._id]
	} else if (parentChanged) {
		// newParentId is null so the topic was detached and is now a root
		path = []
	}

	const title = fields.title ?? topic.title
	const description = fields.description ?? topic.description

	await ctx.db.patch('topics', topicId, {
		...fields,
		...(parentChanged && { parentId: newParentId, path }),
		searchText: [title, description].filter(Boolean).join('\n'),
	} as Partial<Doc<'topics'>>)

	if (parentChanged) {
		await updateDescendantPathsOf(ctx, userId, { id: topicId, path })
	}
}

/**
 * Recursively update child paths of `topic`
 */
async function updateDescendantPathsOf(
	ctx: MutationCtx,
	userId: string,
	topic: { id: Id<'topics'>; path: ReadonlyArray<Id<'topics'>> },
): Promise<void> {
	// TODO(3): this could reach Convex's per-mutation read/write limits; cap depth
	// if topic trees get large.
	const childPath = [...topic.path, topic.id]
	const children = ctx.db
		.query('topics')
		.withIndex('by_parentId', q => q.eq('parentId', topic.id))

	for await (const child of children) {
		if (child.ownerId !== userId) {
			throw new Error('Unable to move children')
		}

		await ctx.db.patch('topics', child._id, { path: childPath })
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
): Promise<Array<Doc<'topics'>>> {
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
	return await ctx.db
		.query('topics')
		.withSearchIndex('by_searchText', q =>
			// The owner filter is the only thing keeping one user's documents
			// out of another's results. It is not an optimization.
			q.search('searchText', query).eq('ownerId', userId),
		)
		.collect()
}
