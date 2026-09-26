import type { Id } from '@convex/_generated/dataModel'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Collection } from '../../../types/collection.types'
import { useCollectionTree } from '../useCollectionTree'

const mocks = vi.hoisted(() => ({
	collections: [] as ReadonlyArray<unknown>,
	selectedCollectionId: undefined as string | undefined,
}))

vi.mock('@tanstack/react-query', () => ({
	useSuspenseQuery: () => ({ data: mocks.collections }),
}))

vi.mock('@tanstack/react-router', () => ({
	useParams: () => ({ collectionId: mocks.selectedCollectionId }),
}))

vi.mock('../../../api/collectionQueries', () => ({
	collectionQueries: { list: () => ({}) },
}))

const collectionId = (id: string) => id as Id<'collections'>

function selectCollection(id: string | undefined) {
	mocks.selectedCollectionId = id
}

function loadCollections(collections: ReadonlyArray<Collection>) {
	mocks.collections = collections
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
})
