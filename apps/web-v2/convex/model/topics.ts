import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { deleteReviewCardsOf } from './reviewCards'

export async function requireOwnedTopic(
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

// TODO(3): this walks the ancestor chain one read at a time, as does
// `deleteChildrenOf` on the way down. Deep hierarchies could reach Convex's
// per-function read limits; cap the depth if topic trees get large.
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

export async function deleteChildrenOf(
	ctx: MutationCtx,
	topicId: Id<'topics'>,
	userId: string,
	visited: Set<Id<'topics'>>,
): Promise<void> {
	if (visited.has(topicId)) {
		return // if have cycle, just stop the recursion here
	}

	visited.add(topicId)

	const children = ctx.db
		.query('topics')
		.withIndex('by_parentId', q => q.eq('parentId', topicId))

	for await (const child of children) {
		if (child.ownerId !== userId) {
			throw new Error('Unable to delete children')
		}

		await deleteChildrenOf(ctx, child._id, userId, visited)
	}

	await deleteReviewCardsOf(ctx, topicId)

	await ctx.db.delete('topics', topicId)
}
