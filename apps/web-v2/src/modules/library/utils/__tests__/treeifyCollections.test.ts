import type { Doc, Id } from '@convex/_generated/dataModel'
import { describe, expect, it } from 'vitest'

import { treeifyCollections } from '../treeifyCollections'

function collection(id: string, parentId?: string): Doc<'collections'> {
	return {
		_id: id as Id<'collections'>,
		_creationTime: 0,
		title: id,
		description: '',
		parentId: parentId as Id<'collections'> | undefined,
		ownerId: 'owner',
		path: parentId ? [parentId as Id<'collections'>] : [],
		searchText: id,
	}
}

describe('treeifyCollections', () => {
	it('maps a flat collection list into a nested tree', () => {
		const collections = [
			collection('root'),
			collection('child', 'root'),
			collection('grandchild', 'child'),
			collection('second-root'),
		]

		expect(treeifyCollections(collections)).toEqual([
			{
				...collections[0],
				childCollections: [
					{
						...collections[1],
						childCollections: [
							{
								...collections[2],
								childCollections: [],
							},
						],
					},
				],
			},
			{
				...collections[3],
				childCollections: [],
			},
		])
	})

	it('links children that appear before their parents', () => {
		const child = collection('child', 'root')
		const root = collection('root')

		expect(treeifyCollections([child, root])).toEqual([
			{ ...root, childCollections: [{ ...child, childCollections: [] }] },
		])
	})

	it('keeps collections with missing parents at the root', () => {
		const orphan = collection('orphan', 'missing')

		expect(treeifyCollections([orphan])).toEqual([
			{ ...orphan, childCollections: [] },
		])
	})

	it('breaks self-referencing parents', () => {
		const selfParent = collection('self', 'self')

		expect(treeifyCollections([selfParent])).toEqual([
			{ ...selfParent, childCollections: [] },
		])
	})

	it('keeps every collection in a parent cycle visible exactly once', () => {
		const first = collection('first', 'second')
		const second = collection('second', 'first')

		expect(treeifyCollections([first, second])).toEqual([
			{ ...first, childCollections: [] },
			{ ...second, childCollections: [] },
		])
	})

	it('keeps descendants of a cycle attached to their parent', () => {
		const first = collection('first', 'second')
		const second = collection('second', 'first')
		const descendant = collection('descendant', 'first')

		expect(treeifyCollections([first, second, descendant])).toEqual([
			{
				...first,
				childCollections: [{ ...descendant, childCollections: [] }],
			},
			{ ...second, childCollections: [] },
		])
	})
})
