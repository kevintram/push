// topic deletion in a separate file because it's cross domain

import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import * as ReviewCards from './reviewCards'
import * as Topics from './topics'

/**
 * Deletes `topicId`, every descendant topic, and every review card attached
 * to any of them.
 */
export async function remove(
	ctx: MutationCtx,
	userId: string,
	topicId: Id<'topics'>,
): Promise<Doc<'topics'>> {
	const topic = await Topics.requireUserOwns(ctx, topicId, userId)

	await removeTree(ctx, topicId, userId, new Set())

	// Returned so callers can navigate away from the deleted topic.
	return topic
}
// TODO(3): this walks the topic tree one read at a time. Deep hierarchies
// could reach Convex's per-function read limits; cap the depth if topic trees
// get large.
async function removeTree(
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

		await removeTree(ctx, child._id, userId, visited)
	}

	await ReviewCards.deleteAllForTopic(ctx, topicId)

	await ctx.db.delete('topics', topicId)
}
