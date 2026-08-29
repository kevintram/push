import type { Id } from '@convex/_generated/dataModel'
import type { CardSearchResult } from '@convex/validators/cards'
import type { CollectionSearchResult } from '@convex/validators/collections'
import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConvexProvider } from 'convex/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Dialog } from '~/components/ui'
import { collectionQueries } from '~/modules/library/api/collectionQueries'
import { cardQueries } from '~/modules/reviews/api/cardQueries'
import { createTestConvexClient } from '~/testing/createTestConvexClient'
import { createTestQueryClient } from '~/testing/createTestQueryClient'

import { SearchDialog } from '../SearchDialog'

vi.mock('@tanstack/react-router', async importOriginal => {
	const actual =
		await importOriginal<typeof import('@tanstack/react-router')>()

	return {
		...actual,
		Link: ({
			children,
			params: _params,
			to,
			...props
		}: ComponentProps<'a'> & { params: unknown; to: string }) => (
			<a href={to} {...props}>
				{children}
			</a>
		),
	}
})

const collections: Array<CollectionSearchResult> = Array.from(
	{ length: 4 },
	(_, index) => ({
		_id: `collection-${index}` as Id<'collections'>,
		description: `Collection description ${index}`,
		pathTitles: [],
		title: `Collection ${index}`,
	}),
)

const cards: Array<CardSearchResult> = Array.from(
	{ length: 4 },
	(_, index) => ({
		_id: `card-${index}` as Id<'cards'>,
		notes: '',
		pathTitles: ['Collection 0'],
		primaryText: `Card ${index}`,
		secondaryText: `Answer ${index}`,
	}),
)

/** Every prefix a test can debounce on while typing its way to `term`. */
function prefixesOf(term: string) {
	return Array.from({ length: term.length }, (_, index) =>
		term.slice(0, index + 1),
	)
}

function renderDialog({
	searchError = false,
	collectionResults = collections,
	cardResults = cards,
}: {
	searchError?: boolean
	collectionResults?: Array<CollectionSearchResult>
	cardResults?: Array<CardSearchResult>
} = {}) {
	const queryClient = createTestQueryClient()
	// `searchError` seeds nothing, so every search falls through to the test
	// client's default `queryFn`, which throws on an unseeded key.
	if (!searchError) {
		for (const prefix of prefixesOf('collectionx')) {
			queryClient.setQueryData(
				collectionQueries.search(prefix).queryKey,
				collectionResults,
			)
			queryClient.setQueryData(
				cardQueries.search(prefix).queryKey,
				cardResults,
			)
		}
	}
	const onOpenChange = vi.fn()

	render(
		<ConvexProvider client={createTestConvexClient()}>
			<QueryClientProvider client={queryClient}>
				<Dialog defaultOpen onOpenChange={onOpenChange}>
					<SearchDialog />
				</Dialog>
			</QueryClientProvider>
		</ConvexProvider>,
	)
	return { onOpenChange }
}

function getSearchbox() {
	return screen.getByRole('searchbox', {
		name: 'Search collections and cards',
	})
}

/** Types `collection` and waits out the debounce so results are on screen. */
async function search(user: ReturnType<typeof userEvent.setup>) {
	await user.type(getSearchbox(), 'collection')
	await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(6))
}

describe('SearchDialog', () => {
	it('shows no results before a query is entered', () => {
		renderDialog()

		expect(screen.queryByRole('status')).not.toBeInTheDocument()
	})

	it('renders compact grouped previews and expands one group at a time', async () => {
		const user = userEvent.setup()
		renderDialog()
		await search(user)

		expect(screen.queryByText('Collection 3')).not.toBeInTheDocument()

		await user.click(
			screen.getAllByRole('button', { name: 'View all' })[0]!,
		)

		expect(screen.getAllByRole('link')).toHaveLength(4)
		expect(screen.getByText('Collection 3')).toBeInTheDocument()
		expect(
			screen.queryByRole('heading', { name: 'Cards (4)' }),
		).not.toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Collapse' }))

		expect(
			screen.getByRole('heading', { name: 'Cards (4)' }),
		).toBeInTheDocument()
		expect(screen.getAllByRole('link')).toHaveLength(6)
	})

	it('renders distinct paths separately from same-titled collection descriptions', async () => {
		const user = userEvent.setup()
		const duplicateCollections: Array<CollectionSearchResult> = [
			{
				_id: 'collection-duplicate-a' as Id<'collections'>,
				description: 'First description',
				pathTitles: ['Science'],
				title: 'Shared title',
			},
			{
				_id: 'collection-duplicate-b' as Id<'collections'>,
				description: 'Second description',
				pathTitles: ['Humanities'],
				title: 'Shared title',
			},
		]
		renderDialog({
			cardResults: [],
			collectionResults: duplicateCollections,
		})

		await user.type(getSearchbox(), 'collection')
		await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(2))

		const sciencePath = screen.getByText('Library / Science / Shared title')
		const humanitiesPath = screen.getByText(
			'Library / Humanities / Shared title',
		)
		const scienceLink = sciencePath.closest('a')
		const humanitiesLink = humanitiesPath.closest('a')

		expect(scienceLink).not.toBeNull()
		expect(humanitiesLink).not.toBeNull()
		expect(
			within(scienceLink!).getByText('First description'),
		).toBeVisible()
		expect(
			within(humanitiesLink!).getByText('Second description'),
		).toBeVisible()
	})

	it('refines results as the query keeps being typed', async () => {
		const user = userEvent.setup()
		renderDialog()
		await search(user)
		const input = getSearchbox()

		await user.click(
			screen.getAllByRole('button', { name: 'View all' })[0]!,
		)
		expect(screen.getAllByRole('link')).toHaveLength(4)

		await user.type(input, 'x')

		expect(input).toHaveFocus()
		expect(input).toHaveValue('collectionx')
		await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(6))
	})

	it('closes on escape', async () => {
		const user = userEvent.setup()
		const { onOpenChange } = renderDialog()

		await user.keyboard('{Escape}')
		expect(onOpenChange.mock.calls[0]?.[0]).toBe(false)
	})

	it('closes when a result is opened', async () => {
		const user = userEvent.setup()
		const { onOpenChange } = renderDialog()
		await search(user)

		await user.click(screen.getAllByRole('link')[0]!)

		expect(onOpenChange.mock.calls[0]?.[0]).toBe(false)
	})

	it('surfaces a failed search', async () => {
		const user = userEvent.setup()
		renderDialog({ searchError: true })

		await user.type(getSearchbox(), 'collection')

		// The message renders twice: once in the live region, once inline.
		await waitFor(() =>
			expect(
				screen.getAllByText('Search could not load. Try again.'),
			).toHaveLength(2),
		)
	})
})
