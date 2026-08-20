import type { Doc, Id } from '@convex/_generated/dataModel'
import { describe, expect, it } from 'vitest'

import { treeifyTopics } from '../treeifyTopics'

function topic(id: string, parentId?: string): Doc<'topics'> {
	return {
		_id: id as Id<'topics'>,
		_creationTime: 0,
		title: id,
		description: '',
		parentId: parentId as Id<'topics'> | undefined,
		ownerId: 'owner',
		searchText: id,
	}
}

describe('treeifyTopics', () => {
	it('maps a flat topic list into a nested tree', () => {
		const topics = [
			topic('root'),
			topic('child', 'root'),
			topic('grandchild', 'child'),
			topic('second-root'),
		]

		expect(treeifyTopics(topics)).toEqual([
			{
				...topics[0],
				childTopics: [
					{
						...topics[1],
						childTopics: [
							{
								...topics[2],
								childTopics: [],
							},
						],
					},
				],
			},
			{
				...topics[3],
				childTopics: [],
			},
		])
	})

	it('links children that appear before their parents', () => {
		const child = topic('child', 'root')
		const root = topic('root')

		expect(treeifyTopics([child, root])).toEqual([
			{ ...root, childTopics: [{ ...child, childTopics: [] }] },
		])
	})

	it('keeps topics with missing parents at the root', () => {
		const orphan = topic('orphan', 'missing')

		expect(treeifyTopics([orphan])).toEqual([
			{ ...orphan, childTopics: [] },
		])
	})

	it('breaks self-referencing parents', () => {
		const selfParent = topic('self', 'self')

		expect(treeifyTopics([selfParent])).toEqual([
			{ ...selfParent, childTopics: [] },
		])
	})

	it('keeps every topic in a parent cycle visible exactly once', () => {
		const first = topic('first', 'second')
		const second = topic('second', 'first')

		expect(treeifyTopics([first, second])).toEqual([
			{ ...first, childTopics: [] },
			{ ...second, childTopics: [] },
		])
	})

	it('keeps descendants of a cycle attached to their parent', () => {
		const first = topic('first', 'second')
		const second = topic('second', 'first')
		const descendant = topic('descendant', 'first')

		expect(treeifyTopics([first, second, descendant])).toEqual([
			{ ...first, childTopics: [{ ...descendant, childTopics: [] }] },
			{ ...second, childTopics: [] },
		])
	})
})
