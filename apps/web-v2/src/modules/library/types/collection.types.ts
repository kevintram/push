import type { Doc } from '@convex/_generated/dataModel'

export type Collection = Doc<'collections'>

export type CollectionWithChildren = Collection & {
	childCollections: Array<CollectionWithChildren>
}
