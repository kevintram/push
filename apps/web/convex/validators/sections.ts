import { type Infer, v } from 'convex/values'

export const sectionBase = v.object({
	collectionId: v.id('collections'),
	ownerId: v.string(),
	title: v.string(),
	// The section's place among its collection's sections, as a fractional
	// index key. Absent only on sections created before ordering existed,
	// which sort first until `migrations.backfillRanks` ranks them.
	rank: v.optional(v.string()),
})

export const sectionRead = sectionBase.extend({
	_id: v.id('sections'),
	_creationTime: v.number(),
})

// Sections are created from an empty "add" button, so the title is optional.
// The parent collection remains required and `ownerId` comes from the
// caller's identity.
export const sectionCreate = v.object({
	...sectionBase.omit('ownerId', 'rank').partial().fields,
	collectionId: v.id('collections'), // require collectionId
})

// Only the title is mutable, and `ownerId` stays unsettable. Reordering goes
// through `sectionMove`, and changing collections through `moveToCollection`.
export const sectionPatch = sectionBase.pick('title').partial()

// Places the section right after `afterId`, or first when it is `null`. The
// server picks the key, so clients never send one.
export const sectionMove = v.object({
	afterId: v.union(v.id('sections'), v.null()),
})

export type Section = Infer<typeof sectionRead>
export type SectionCreate = Infer<typeof sectionCreate>
export type SectionPatch = Infer<typeof sectionPatch>
export type SectionMove = Infer<typeof sectionMove>
