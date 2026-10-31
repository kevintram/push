import type { Id } from '@convex/_generated/dataModel'
import type { Collection } from '@convex/validators/collections'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	detail: vi.fn(),
	useSuspenseQuery: vi.fn(),
	collectionPathBreadcrumbs: vi.fn(
		({ children }: { children?: ReactNode }) => children,
	),
}))

vi.mock('@tanstack/react-query', () => ({
	useSuspenseQuery: mocks.useSuspenseQuery,
}))

vi.mock('~/modules/collections/api/collectionQueries', () => ({
	collectionQueries: { detail: mocks.detail },
}))

vi.mock('~/modules/collections/components/CollectionPathBreadcrumbs', () => ({
	CollectionPathBreadcrumbs: mocks.collectionPathBreadcrumbs,
}))

import { CardBreadcrumbs } from '../CardBreadcrumbs'

function collection(id: string, title = id): Collection {
	return {
		_id: id as Id<'collections'>,
		_creationTime: 0,
		title,
		description: '',
		ownerId: 'owner',
		path: [],
		searchText: title,
	}
}

describe('CardBreadcrumbs', () => {
	beforeEach(() => {
		mocks.detail.mockReturnValue('collection-detail-query')
		mocks.useSuspenseQuery.mockReturnValue({
			data: {
				...collection('current'),
				path: [collection('ancestor')],
			},
		})
		mocks.collectionPathBreadcrumbs.mockClear()
	})

	it('fetches the expanded collection and delegates the complete path and card', () => {
		const collectionId = 'current' as Id<'collections'>
		const onNavigate = vi.fn()

		render(
			<CardBreadcrumbs
				primaryText='A card'
				collectionId={collectionId}
				onNavigate={onNavigate}
			/>,
		)

		expect(mocks.detail).toHaveBeenCalledWith(collectionId, {
			expandPath: true,
		})
		expect(mocks.useSuspenseQuery).toHaveBeenCalledWith(
			'collection-detail-query',
		)
		const delegatedProps =
			mocks.collectionPathBreadcrumbs.mock.calls[0]?.[0]
		expect(delegatedProps).toEqual(
			expect.objectContaining({
				collections: [
					expect.objectContaining({ _id: 'ancestor' }),
					expect.objectContaining({ _id: 'current' }),
				],
				onNavigate,
			}),
		)
		expect(screen.getByText('A card')).toHaveAttribute(
			'aria-current',
			'page',
		)
	})
})
