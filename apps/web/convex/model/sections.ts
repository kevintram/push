import { ConvexError } from 'convex/values'

import { backfillRanks, placeInLine, rankAfter } from '../../shared/ordering'
import type { Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import type {
	Section,
	SectionCreate,
	SectionPatch,
} from '../validators/sections'
import * as Collections from './collections'

export async function requireUserOwns(
	ctx: QueryCtx,
	userId: string,
	sectionId: Id<'sections'>,
): Promise<Section> {
	const section = await ctx.db.get('sections', sectionId)

	if (!section || section.ownerId !== userId) {
		throw new ConvexError('Section not found')
	}

	return section
}

/**
 * Throws unless `sectionId` names a section the user owns inside
 * `collectionId`. A card's section must live in the card's own collection.
 */
export async function requireUserOwnsInCollection(
	ctx: QueryCtx,
	userId: string,
	sectionId: Id<'sections'>,
	collectionId: Id<'collections'>,
): Promise<Section> {
	const section = await requireUserOwns(ctx, userId, sectionId)

	if (section.collectionId !== collectionId) {
		throw new Error("Section is not in the card's collection")
	}

	return section
}

/** Lists a collection's sections in display order. */
export async function listByCollection(
	ctx: QueryCtx,
	userId: string,
	collectionId: Id<'collections'>,
): Promise<Array<Section>> {
	await Collections.requireUserOwns(ctx, userId, collectionId)

	const sections = await ctx.db
		.query('sections')
		.withIndex('by_collectionId_rank', q =>
			q.eq('collectionId', collectionId),
		)
		.collect()

	// Sections share their collection's owner given well-formed data. The check
	// keeps a malformed foreign section from leaking through an owned collection.
	return sections.filter(section => section.ownerId === userId)
}

export async function create(
	ctx: MutationCtx,
	userId: string,
	fields: SectionCreate,
): Promise<Id<'sections'>> {
	await Collections.requireUserOwns(ctx, userId, fields.collectionId)

	// New sections go to the bottom.
	const last = await ctx.db
		.query('sections')
		.withIndex('by_collectionId_rank', q =>
			q.eq('collectionId', fields.collectionId),
		)
		.order('desc')
		.first()

	return await ctx.db.insert('sections', {
		collectionId: fields.collectionId,
		ownerId: userId,
		title: fields.title ?? '',
		rank: rankAfter(last?.rank),
	})
}

export async function update(
	ctx: MutationCtx,
	userId: string,
	sectionId: Id<'sections'>,
	patch: SectionPatch,
): Promise<void> {
	await requireUserOwns(ctx, userId, sectionId)
	await ctx.db.patch('sections', sectionId, patch)
}

/**
 * Places `sectionId` right after `afterId` among its collection's sections, or
 * first when `afterId` is null. Writes the one section, plus keys for any
 * sections still unranked.
 */
export async function move(
	ctx: MutationCtx,
	userId: string,
	sectionId: Id<'sections'>,
	afterId: Id<'sections'> | null,
): Promise<void> {
	const section = await requireUserOwns(ctx, userId, sectionId)
	const sections = await listByCollection(ctx, userId, section.collectionId)
	const { rank, backfill } = placeInLine(sections, sectionId, afterId)

	for (const row of backfill) {
		await ctx.db.patch('sections', row._id, { rank: row.rank })
	}
	await ctx.db.patch('sections', sectionId, { rank })
}

/**
 * Ranks any of `collectionId`'s sections created before ordering existed,
 * keeping their order.
 */
export async function backfillForCollection(
	ctx: MutationCtx,
	collectionId: Id<'collections'>,
): Promise<void> {
	const sections = await ctx.db
		.query('sections')
		.withIndex('by_collectionId_rank', q =>
			q.eq('collectionId', collectionId),
		)
		.collect()

	for (const row of backfillRanks(sections)) {
		await ctx.db.patch('sections', row._id, { rank: row.rank })
	}
}

/**
 * Deletes every section belonging to `collectionId`. Called while removing a
 * collection subtree, after its cards are gone.
 */
export async function deleteAllForCollection(
	ctx: MutationCtx,
	collectionId: Id<'collections'>,
): Promise<void> {
	const sections = ctx.db
		.query('sections')
		.withIndex('by_collectionId_rank', q =>
			q.eq('collectionId', collectionId),
		)

	for await (const section of sections) {
		await ctx.db.delete('sections', section._id)
	}
}
