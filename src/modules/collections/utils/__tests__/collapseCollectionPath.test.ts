import { describe, expect, it } from 'vitest'

import { collapseCollectionPath } from '../collapseCollectionPath'

describe('collapseCollectionPath', () => {
	it.each([
		{ path: [], head: [], hidden: [], tail: [] },
		{ path: ['a'], head: ['a'], hidden: [], tail: [] },
		{ path: ['a', 'b', 'c'], head: ['a', 'b', 'c'], hidden: [], tail: [] },
		{
			path: ['a', 'b', 'c', 'd'],
			head: ['a'],
			hidden: ['b', 'c'],
			tail: ['d'],
		},
		{
			path: ['a', 'b', 'c', 'd', 'e'],
			head: ['a'],
			hidden: ['b', 'c', 'd'],
			tail: ['e'],
		},
	])('splits $path', ({ path, ...expected }) => {
		expect(collapseCollectionPath(path)).toEqual(expected)
	})
})
