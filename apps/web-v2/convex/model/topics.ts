import type { Infer } from 'convex/values'

import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import type { topicCreate, topicPatch } from '../validators/topics'

export async function requireUserOwns(
	ctx: QueryCtx,
	topicId: Id<'topics'>,
	userId: string,
): Promise<Doc<'topics'>> {
	const topic = await ctx.db.get('topics', topicId)

	if (!topic || topic.ownerId !== userId) {
		throw new Error('Topic not found')
	}

	return topic
}

// TODO(3): this walks the ancestor chain one read at a time. Deep hierarchies
// could reach Convex's per-function read limits; cap the depth if topic trees
// get large.
export async function validateParent(
	ctx: MutationCtx,
	parentId: Id<'topics'>,
	userId: string,
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
	return await requireUserOwns(ctx, topicId, userId)
}

export async function create(
	ctx: MutationCtx,
	userId: string,
	fields: Infer<typeof topicCreate>,
): Promise<Id<'topics'>> {
	if (fields.parentId) {
		await validateParent(ctx, fields.parentId, userId)
	}

	return await ctx.db.insert('topics', {
		title: fields.title ?? '',
		description: fields.description ?? '',
		parentId: fields.parentId,
		ownerId: userId,
	})
}

export async function update(
	ctx: MutationCtx,
	userId: string,
	topicId: Id<'topics'>,
	patch: Infer<typeof topicPatch>,
): Promise<void> {
	await requireUserOwns(ctx, topicId, userId)

	if (patch.parentId === topicId) {
		throw new Error('A topic cannot be its own parent')
	}

	if (patch.parentId) {
		await validateParent(ctx, patch.parentId, userId, topicId)
	}

	await ctx.db.patch('topics', topicId, {
		...patch,
		// An omitted key leaves the parent alone. `null` detaches the topic,
		// which in Convex means patching an explicit `undefined`.
		...(patch.parentId === null && { parentId: undefined }),
	} as Partial<Doc<'topics'>>)
}
