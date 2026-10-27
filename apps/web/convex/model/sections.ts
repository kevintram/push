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

/** Lists a collection's sections, oldest first. */
export async function listByCollection(
	ctx: QueryCtx,
	userId: string,
	collectionId: Id<'collections'>,
): Promise<Array<Section>> {
	await Collections.requireUserOwns(ctx, userId, collectionId)

	const sections = await ctx.db
		.query('sections')
		.withIndex('by_collectionId', q => q.eq('collectionId', collectionId))
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

	return await ctx.db.insert('sections', {
		collectionId: fields.collectionId,
		ownerId: userId,
		title: fields.title ?? '',
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
 * Deletes every section belonging to `collectionId`. Called while removing a
 * collection subtree, after its cards are gone.
 */
export async function deleteAllForCollection(
	ctx: MutationCtx,
	collectionId: Id<'collections'>,
): Promise<void> {
	const sections = ctx.db
		.query('sections')
		.withIndex('by_collectionId', q => q.eq('collectionId', collectionId))

	for await (const section of sections) {
		await ctx.db.delete('sections', section._id)
	}
}
