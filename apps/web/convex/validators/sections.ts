import { type Infer, v } from 'convex/values'

export const sectionBase = v.object({
	collectionId: v.id('collections'),
	ownerId: v.string(),
	title: v.string(),
})

export const sectionRead = sectionBase.extend({
	_id: v.id('sections'),
	_creationTime: v.number(),
})

// Sections are created from an empty "add" button, so the title is optional.
// The parent collection remains required and `ownerId` comes from the
// caller's identity.
export const sectionCreate = v.object({
	...sectionBase.omit('ownerId').partial().fields,
	collectionId: v.id('collections'), // require collectionId
})

// Only the title is mutable. A section cannot move to another collection, and
// `ownerId` stays unsettable.
export const sectionPatch = sectionBase.pick('title').partial()

export type Section = Infer<typeof sectionRead>
export type SectionCreate = Infer<typeof sectionCreate>
export type SectionPatch = Infer<typeof sectionPatch>
