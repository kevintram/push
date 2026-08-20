import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import type { TopicCreate, TopicPatch } from '../validators/topics'

export async function requireUserOwns(
	ctx: QueryCtx,
	userId: string,
	topicId: Id<'topics'>,
): Promise<Doc<'topics'>> {
	const topic = await ctx.db.get('topics', topicId)

	if (!topic || topic.ownerId !== userId) {
		throw new Error('Topic not found')
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
): Promise<Doc<'topics'>> {
	return await requireUserOwns(ctx, userId, topicId)
}

export async function ancestorsOf(
	ctx: QueryCtx,
	userId: string,
	topicId: Id<'topics'>,
	includeSelf: boolean,
): Promise<Array<Doc<'topics'>>> {
	const topic = await requireUserOwns(ctx, userId, topicId)
	const ancestors: Array<Doc<'topics'>> = []
	const visited = new Set<Id<'topics'>>([topicId])
	let ancestorId = topic.parentId

	while (ancestorId) {
		if (visited.has(ancestorId)) {
			throw new Error('Parent topic hierarchy contains a cycle')
		}

		visited.add(ancestorId)

		const ancestor = await ctx.db.get('topics', ancestorId)
		if (!ancestor || ancestor.ownerId !== userId) {
			throw new Error('Parent topic not found')
		}

		ancestors.push(ancestor)
		ancestorId = ancestor.parentId
	}

	ancestors.reverse()

	if (includeSelf) {
		ancestors.push(topic)
	}

	return ancestors
}

export async function create(
	ctx: MutationCtx,
	userId: string,
	fields: TopicCreate,
): Promise<Id<'topics'>> {
	if (fields.parentId) {
		await validateParent(ctx, userId, fields.parentId)
	}

	const title = fields.title ?? ''
	const description = fields.description ?? ''

	return await ctx.db.insert('topics', {
		title,
		description,
		parentId: fields.parentId,
		ownerId: userId,
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

	if (patch.parentId === topicId) {
		throw new Error('A topic cannot be its own parent')
	}

	if (patch.parentId) {
		await validateParent(ctx, userId, patch.parentId, topicId)
	}

	// Recomputed unconditionally from the merged doc: when the patch touches no
	// text field this rewrites the identical string, which is cheaper than a
	// second copy of the field list that could drift from the one below.
	const title = patch.title ?? topic.title
	const description = patch.description ?? topic.description

	await ctx.db.patch('topics', topicId, {
		...patch,
		// An omitted key leaves the parent alone. `null` detaches the topic,
		// which in Convex means patching an explicit `undefined`.
		...(patch.parentId === null && { parentId: undefined }),
		searchText: [title, description].filter(Boolean).join('\n'),
	} as Partial<Doc<'topics'>>)
}

// TODO(3): this walks the ancestor chain one read at a time. Deep hierarchies
// could reach Convex's per-function read limits; cap the depth if topic trees
// get large.
export async function validateParent(
	ctx: MutationCtx,
	userId: string,
	parentId: Id<'topics'>,
	topicId?: Id<'topics'>,
): Promise<void> {
	const visited = new Set<Id<'topics'>>()
	let ancestorId: Id<'topics'> | undefined = parentId

	while (ancestorId) {
		if (ancestorId === topicId) {
			throw new Error(
				'A topic cannot be nested below one of its descendants',
			)
		}

		if (visited.has(ancestorId)) {
			throw new Error('Parent topic hierarchy contains a cycle')
		}

		visited.add(ancestorId)

		const ancestor: Doc<'topics'> | null = await ctx.db.get(
			'topics',
			ancestorId,
		)
		if (!ancestor || ancestor.ownerId !== userId) {
			throw new Error('Parent topic not found')
		}

		ancestorId = ancestor.parentId
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
