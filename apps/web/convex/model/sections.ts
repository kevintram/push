import {
	backfillRanks,
	placeInLine,
	placeNewInLine,
	rankAfter,
} from '../../shared/ordering'
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
		throw new Error('Section not found')
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

/** A key that sorts after every section in `collectionId`. */
export async function rankAtEnd(
	ctx: QueryCtx,
	collectionId: Id<'collections'>,
): Promise<string> {
	const last = await ctx.db
		.query('sections')
		.withIndex('by_collectionId_rank', q =>
			q.eq('collectionId', collectionId),
		)
		.order('desc')
		.first()

	return rankAfter(last?.rank)
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

/**
 * Creates a section right after `afterId` among its collection's sections, or
 * first when `afterId` is null. Also writes keys for any sections still
 * unranked.
 */
export async function create(
	ctx: MutationCtx,
	userId: string,
	{ afterId, collectionId, title }: SectionCreate,
): Promise<Id<'sections'>> {
	const sections = await listByCollection(ctx, userId, collectionId)
	// A client with a stale list can name a section deleted since. The new
	// section still gets created, at the bottom.
	const anchorId =
		afterId !== null && (await ctx.db.get('sections', afterId)) === null
			? (sections.at(-1)?._id ?? null)
			: afterId
	const { rank, backfill } = placeNewInLine(sections, anchorId)

	for (const row of backfill) {
		await ctx.db.patch('sections', row._id, { rank: row.rank })
	}
	return await ctx.db.insert('sections', {
		collectionId,
		ownerId: userId,
		title: title ?? '',
		rank,
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
 * Places `sectionIds`, in that order, as a run among their collection's
 * sections, right after `afterId` or first when it is null. Writes each moving
 * section, plus keys for any sections still unranked.
 */
export async function move(
	ctx: MutationCtx,
	userId: string,
	sectionIds: ReadonlyArray<Id<'sections'>>,
	afterId: Id<'sections'> | null,
): Promise<void> {
	const moving = await Promise.all(
		sectionIds.map(sectionId => requireUserOwns(ctx, userId, sectionId)),
	)
	const collectionId = moving[0]?.collectionId
	if (collectionId === undefined) return
	if (moving.some(section => section.collectionId !== collectionId)) {
		throw new Error('Sections can only move together within one collection')
	}

	const sections = await listByCollection(ctx, userId, collectionId)
	const { ranks, backfill } = placeInLine(sections, sectionIds, afterId)

	for (const row of [...backfill, ...ranks]) {
		await ctx.db.patch('sections', row._id, { rank: row.rank })
	}
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
