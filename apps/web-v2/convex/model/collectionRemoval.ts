// collection deletion in a separate file because it's cross domain

import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import * as Cards from './cards'
import * as Collections from './collections'

/**
 * Deletes `collectionId`, every descendant collection, and every card attached
 * to any of them.
 */
export async function remove(
	ctx: MutationCtx,
	userId: string,
	collectionId: Id<'collections'>,
): Promise<Doc<'collections'>> {
	const collection = await Collections.requireUserOwns(
		ctx,
		userId,
		collectionId,
	)

	await removeTree(ctx, userId, collectionId, new Set())

	// Returned so callers can navigate away from the deleted collection.
	return collection
}

/**
 * Recursive helper for deleting `collectionId`.
 */
async function removeTree(
	ctx: MutationCtx,
	userId: string,
	collectionId: Id<'collections'>,
	visited: Set<Id<'collections'>>,
): Promise<void> {
	// TODO(3): this walks the collection tree one level at a time. Deep hierarchies
	// could reach Convex's per-function read limits; cap the depth if collection trees
	// get large.
	if (visited.has(collectionId)) {
		// if have cycle
		// just stop the recursion here so don't try to delete something already deleted
		return
	}

	visited.add(collectionId)

	const children = await ctx.db
		.query('collections')
		.withIndex('by_parentId', q => q.eq('parentId', collectionId))
		.collect()

	for (const child of children) {
		if (child.ownerId !== userId) {
			throw new Error('Unable to delete children')
		}
	}

	// Delete children in parallel
	await Promise.all([
		...children.map(child => removeTree(ctx, userId, child._id, visited)),
		Cards.deleteAllForCollection(ctx, collectionId),
	])

	await ctx.db.delete('collections', collectionId)
}
