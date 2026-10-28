// section deletion in a separate file because it's cross domain

import type { Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import type { Section } from '../validators/sections'
import * as Cards from './cards'
import * as Sections from './sections'

/**
 * Deletes `sectionId`, every card in it, and every review of those cards.
 */
export async function remove(
	ctx: MutationCtx,
	userId: string,
	sectionId: Id<'sections'>,
): Promise<Section> {
	const section = await Sections.requireUserOwns(ctx, userId, sectionId)

	await Cards.deleteAllForSection(ctx, section)
	await ctx.db.delete('sections', sectionId)

	// Returned so callers can tell which collection the section left.
	return section
}
