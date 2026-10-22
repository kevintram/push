import type { Id } from '@convex/_generated/dataModel'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Collection } from '../../../types/collection.types'
import { useCollectionTree } from '../useCollectionTree'

const mocks = vi.hoisted(() => ({
	collections: [] as ReadonlyArray<unknown>,
	status: 'success' as 'pending' | 'success' | 'error',
	selectedCollectionId: undefined as string | undefined,
}))

vi.mock('@tanstack/react-query', () => ({
	// An errored query keeps its last data, as `@convex-dev/react-query` does.
	useQuery: () => ({
		data: mocks.status === 'pending' ? undefined : mocks.collections,
		isSuccess: mocks.status === 'success',
		status: mocks.status,
	}),
}))

vi.mock('@tanstack/react-router', () => ({
	useParams: () => ({ collectionId: mocks.selectedCollectionId }),
}))

vi.mock('../../../api/collectionQueries', () => ({
	collectionQueries: { list: () => ({}) },
}))

const STORAGE_KEY = 'collectionsNavigationOpenIds'

const collectionId = (id: string) => id as Id<'collections'>

function selectCollection(id: string | undefined) {
	mocks.selectedCollectionId = id
}

function loadCollections(collections: ReadonlyArray<Collection>) {
	mocks.collections = collections
	mocks.status = 'success'
}

function startLoading() {
	mocks.status = 'pending'
}

function failQuery() {
	mocks.status = 'error'
}

function storedOpenIds(): unknown {
	return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
}

function makeCollection(
	id: string,
	path: ReadonlyArray<string> = [],
	parentId?: string,
): Collection {
	return {
		_id: collectionId(id),
		_creationTime: 0,
		title: id,
		description: '',
		ownerId: 'owner',
		searchText: id,
		path: path.map(collectionId),
		parentId: parentId === undefined ? undefined : collectionId(parentId),
	}
}

describe('useCollectionTree', () => {
	beforeEach(() => {
		window.localStorage.clear()
		loadCollections([])
		selectCollection(undefined)
	})

	it('returns the treeified forest for the given flat list', () => {
		const collections = [
			makeCollection('root'),
			makeCollection('child', ['root'], 'root'),
		]

		loadCollections(collections)
		const { result } = renderHook(() => useCollectionTree())

		expect(result.current.rootCollections).toHaveLength(1)
		expect(result.current.rootCollections[0]?._id).toBe('root')
		expect(
			result.current.rootCollections[0]?.childCollections,
		).toHaveLength(1)
	})

	it('keeps the rootCollections reference stable when only the open set changes', () => {
		const collections = [makeCollection('root')]

		loadCollections(collections)
		const { result } = renderHook(() => useCollectionTree())

		const tree = result.current.rootCollections

		act(() => {
			result.current.setCollectionOpen(collectionId('root'), true)
		})

		expect(result.current.rootCollections).toBe(tree)
	})

	it('opens and closes one collection without replacing other open branches', () => {
		const collections = [makeCollection('first'), makeCollection('second')]

		loadCollections(collections)
		const { result } = renderHook(() => useCollectionTree())

		act(() => {
			result.current.setCollectionOpen(collectionId('first'), true)
			result.current.setCollectionOpen(collectionId('second'), true)
			result.current.setCollectionOpen(collectionId('first'), false)
		})

		expect([...result.current.openCollectionIds]).toEqual(['second'])
	})

	it('preserves the set reference when an operation makes no change', () => {
		const collections = [makeCollection('root')]

		loadCollections(collections)
		const { result } = renderHook(() => useCollectionTree())

		act(() => {
			result.current.setCollectionOpen(collectionId('root'), true)
		})
		const openIds = result.current.openCollectionIds

		act(() => {
			result.current.setCollectionOpen(collectionId('root'), true)
		})

		expect(result.current.openCollectionIds).toBe(openIds)
	})

	it('collapses every open collection', () => {
		const collections = [makeCollection('first'), makeCollection('second')]

		loadCollections(collections)
		const { result } = renderHook(() => useCollectionTree())

		act(() => {
			result.current.setCollectionOpen(collectionId('first'), true)
			result.current.setCollectionOpen(collectionId('second'), true)
		})
		act(() => {
			result.current.collapseAll()
		})

		expect(result.current.openCollectionIds.size).toBe(0)
	})

	it('opens the selected collection and its ancestors', () => {
		const collections = [
			makeCollection('root'),
			makeCollection('parent', ['root'], 'root'),
			makeCollection('child', ['root', 'parent'], 'parent'),
		]

		selectCollection('child')
		loadCollections(collections)
		const { result } = renderHook(() => useCollectionTree())

		expect([...result.current.openCollectionIds]).toEqual([
			'root',
			'parent',
			'child',
		])
	})

	it('does not reopen after collapse-all when collections gets a new array reference but the selection is unchanged', () => {
		const initialCollections = [
			makeCollection('root'),
			makeCollection('child', ['root'], 'root'),
		]

		loadCollections(initialCollections)
		selectCollection('child')
		const { result, rerender } = renderHook(() => useCollectionTree())

		expect([...result.current.openCollectionIds]).toEqual(['root', 'child'])

		act(() => {
			result.current.collapseAll()
		})
		expect(result.current.openCollectionIds.size).toBe(0)

		const refetchedCollections = [
			makeCollection('root'),
			makeCollection('child', ['root'], 'root'),
		]
		loadCollections(refetchedCollections)
		rerender()

		expect(result.current.openCollectionIds.size).toBe(0)
	})

	it('reopens the shared ancestors after collapse-all when navigating to a sibling', () => {
		const collections = [
			makeCollection('root'),
			makeCollection('first-child', ['root'], 'root'),
			makeCollection('second-child', ['root'], 'root'),
		]

		loadCollections(collections)
		selectCollection('first-child')
		const { result, rerender } = renderHook(() => useCollectionTree())

		act(() => {
			result.current.collapseAll()
		})
		expect(result.current.openCollectionIds.size).toBe(0)

		selectCollection('second-child')
		rerender()

		expect([...result.current.openCollectionIds]).toEqual([
			'root',
			'second-child',
		])
	})

	it('opens a selected root collection, which has no ancestors', () => {
		const collections = [makeCollection('root')]

		selectCollection('root')
		loadCollections(collections)
		const { result } = renderHook(() => useCollectionTree())

		expect([...result.current.openCollectionIds]).toEqual(['root'])
	})

	it('opens nothing when the route has no collection', () => {
		const collections = [
			makeCollection('root'),
			makeCollection('child', ['root'], 'root'),
		]

		loadCollections(collections)
		const { result } = renderHook(() => useCollectionTree())

		expect(result.current.openCollectionIds.size).toBe(0)
	})

	describe('hidden selection', () => {
		const nestedCollections = [
			makeCollection('root'),
			makeCollection('parent', ['root'], 'root'),
			makeCollection('child', ['root', 'parent'], 'parent'),
		]

		it('reports the selection while its parent is collapsed', () => {
			selectCollection('child')
			loadCollections(nestedCollections)
			const { result } = renderHook(() => useCollectionTree())

			expect(result.current.hiddenSelection).toBeUndefined()

			act(() => {
				result.current.setCollectionOpen(collectionId('parent'), false)
			})

			expect(result.current.hiddenSelection?._id).toBe('child')
		})

		it('reports the selection while a further ancestor is collapsed', () => {
			selectCollection('child')
			loadCollections(nestedCollections)
			const { result } = renderHook(() => useCollectionTree())

			act(() => {
				result.current.setCollectionOpen(collectionId('root'), false)
			})

			expect(
				result.current.openCollectionIds.has(collectionId('parent')),
			).toBe(true)
			expect(result.current.hiddenSelection?._id).toBe('child')
		})

		it('does not report the selection when only the selection is collapsed', () => {
			selectCollection('child')
			loadCollections(nestedCollections)
			const { result } = renderHook(() => useCollectionTree())

			act(() => {
				result.current.setCollectionOpen(collectionId('child'), false)
			})

			expect(result.current.hiddenSelection).toBeUndefined()
		})

		it('never reports a selected root collection', () => {
			selectCollection('root')
			loadCollections(nestedCollections)
			const { result } = renderHook(() => useCollectionTree())

			act(() => {
				result.current.collapseAll()
			})

			expect(result.current.hiddenSelection).toBeUndefined()
		})

		it('ignores ancestors missing from the collection list', () => {
			selectCollection('orphan')
			loadCollections([makeCollection('orphan', ['missing'], 'missing')])
			const { result } = renderHook(() => useCollectionTree())

			act(() => {
				result.current.collapseAll()
			})

			expect(result.current.hiddenSelection).toBeUndefined()
		})

		it('reveals the selection by opening its ancestors and itself', () => {
			selectCollection('child')
			loadCollections(nestedCollections)
			const { result } = renderHook(() => useCollectionTree())

			act(() => {
				result.current.collapseAll()
			})
			expect(result.current.hiddenSelection?._id).toBe('child')

			act(() => {
				result.current.revealSelection()
			})

			expect([...result.current.openCollectionIds]).toEqual([
				'root',
				'parent',
				'child',
			])
			expect(result.current.hiddenSelection).toBeUndefined()
		})
	})

	describe('persistence', () => {
		afterEach(() => {
			vi.restoreAllMocks()
		})

		const collections = [
			makeCollection('root'),
			makeCollection('child', ['root'], 'root'),
		]

		it('restores the saved open collections on mount', () => {
			window.localStorage.setItem(STORAGE_KEY, '["root"]')
			loadCollections(collections)
			const { result } = renderHook(() => useCollectionTree())

			expect([...result.current.openCollectionIds]).toEqual(['root'])
		})

		it('keeps the open collections across an unmount and remount', () => {
			loadCollections(collections)
			const first = renderHook(() => useCollectionTree())

			act(() => {
				first.result.current.setCollectionOpen(
					collectionId('root'),
					true,
				)
			})
			first.unmount()

			const { result } = renderHook(() => useCollectionTree())

			expect([...result.current.openCollectionIds]).toEqual(['root'])
		})

		it('saves an empty set after collapse-all', () => {
			window.localStorage.setItem(STORAGE_KEY, '["root"]')
			loadCollections(collections)
			const { result } = renderHook(() => useCollectionTree())

			act(() => {
				result.current.collapseAll()
			})

			expect(storedOpenIds()).toEqual([])
		})

		it('keeps the saved collections while the list loads', () => {
			window.localStorage.setItem(STORAGE_KEY, '["root","child"]')
			startLoading()
			const { result, rerender } = renderHook(() => useCollectionTree())

			expect(storedOpenIds()).toEqual(['root', 'child'])

			loadCollections(collections)
			rerender()

			expect(storedOpenIds()).toEqual(['root', 'child'])
			expect([...result.current.openCollectionIds]).toEqual([
				'root',
				'child',
			])
		})

		it('drops deleted collections once the list loads', () => {
			window.localStorage.setItem(STORAGE_KEY, '["root","deleted"]')
			loadCollections(collections)
			const { result } = renderHook(() => useCollectionTree())

			expect([...result.current.openCollectionIds]).toEqual(['root'])
			expect(storedOpenIds()).toEqual(['root'])
		})

		it('drops a collection deleted while it is open', () => {
			loadCollections(collections)
			const { result, rerender } = renderHook(() => useCollectionTree())

			act(() => {
				result.current.setCollectionOpen(collectionId('child'), true)
			})
			loadCollections([makeCollection('root')])
			rerender()

			expect(result.current.openCollectionIds.size).toBe(0)
			expect(storedOpenIds()).toEqual([])
		})

		it('saves changes while the query errors with its last data', () => {
			loadCollections(collections)
			const { result } = renderHook(() => useCollectionTree())

			failQuery()
			act(() => {
				result.current.setCollectionOpen(collectionId('root'), true)
			})

			expect(storedOpenIds()).toEqual(['root'])
		})

		it('saves the selection path alongside restored collections', () => {
			window.localStorage.setItem(STORAGE_KEY, '["other"]')
			selectCollection('child')
			loadCollections([...collections, makeCollection('other')])
			renderHook(() => useCollectionTree())

			expect(storedOpenIds()).toEqual(['other', 'root', 'child'])
		})

		it('does not save again when a refetch leaves the saved set unchanged', () => {
			window.localStorage.setItem(STORAGE_KEY, '["root"]')
			loadCollections(collections)
			const { rerender } = renderHook(() => useCollectionTree())
			const setItem = vi.spyOn(window.localStorage, 'setItem')

			loadCollections([
				makeCollection('root'),
				makeCollection('child', ['root'], 'root'),
			])
			rerender()

			expect(setItem).not.toHaveBeenCalled()
		})

		it('ignores malformed saved state', () => {
			window.localStorage.setItem(STORAGE_KEY, '{"root":true}')
			loadCollections(collections)
			const { result } = renderHook(() => useCollectionTree())

			expect(result.current.openCollectionIds.size).toBe(0)
		})
	})
})
