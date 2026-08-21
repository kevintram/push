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
	const topic = await Topics.requireUserOwns(ctx, userId, topicId)

	await removeTree(ctx, userId, topicId, new Set())

	// Returned so callers can navigate away from the deleted topic.
	return topic
}

/**
 * Recursive helper for deleting `topicId`.
 */
async function removeTree(
	ctx: MutationCtx,
	userId: string,
	topicId: Id<'topics'>,
	visited: Set<Id<'topics'>>,
): Promise<void> {
	// TODO(3): this walks the topic tree one level at a time. Deep hierarchies
	// could reach Convex's per-function read limits; cap the depth if topic trees
	// get large.
	if (visited.has(topicId)) {
		// if have cycle
		// just stop the recursion here so don't try to delete something already deleted
		return
	}

	visited.add(topicId)

	const children = await ctx.db
		.query('topics')
		.withIndex('by_parentId', q => q.eq('parentId', topicId))
		.collect()

	for (const child of children) {
		if (child.ownerId !== userId) {
			throw new Error('Unable to delete children')
		}
	}

	// Delete children in parallel
	await Promise.all([
		...children.map(child => removeTree(ctx, userId, child._id, visited)),
		ReviewCards.deleteAllForTopic(ctx, topicId),
	])

	await ctx.db.delete('topics', topicId)
}
