import type { Doc, Id } from '@convex/_generated/dataModel'
import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConvexProvider } from 'convex/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Dialog } from '~/components/ui'
import { topicQueries } from '~/modules/library/api/topicQueries'
import { reviewCardQueries } from '~/modules/reviews/api/reviewCardQueries'
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

const topics: Array<Doc<'topics'>> = Array.from({ length: 4 }, (_, index) => ({
	_id: `topic-${index}` as Id<'topics'>,
	_creationTime: index,
	description: `Topic description ${index}`,
	ownerId: 'user-1',
	searchText: `Topic ${index}\nTopic description ${index}`,
	title: `Topic ${index}`,
}))

const cards: Array<Doc<'reviewCards'>> = Array.from(
	{ length: 4 },
	(_, index) => ({
		_id: `card-${index}` as Id<'reviewCards'>,
		_creationTime: index,
		notes: '',
		ownerId: 'user-1',
		primaryText: `Card ${index}`,
		searchText: `Card ${index}\nAnswer ${index}`,
		secondaryText: `Answer ${index}`,
		state: 'LEARNING',
		topicId: topics[0]!._id,
		type: 'flashcard',
	}),
)

/** Every prefix a test can debounce on while typing its way to `term`. */
function prefixesOf(term: string) {
	return Array.from({ length: term.length }, (_, index) =>
		term.slice(0, index + 1),
	)
}

function renderDialog({ searchError = false }: { searchError?: boolean } = {}) {
	const queryClient = createTestQueryClient()
	// `searchError` seeds nothing, so every search falls through to the test
	// client's default `queryFn`, which throws on an unseeded key.
	if (!searchError) {
		for (const prefix of prefixesOf('topicx')) {
			queryClient.setQueryData(
				topicQueries.search(prefix).queryKey,
				topics,
			)
			queryClient.setQueryData(
				reviewCardQueries.search(prefix).queryKey,
				cards,
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
		name: 'Search topics and review cards',
	})
}

/** Types `topic` and waits out the debounce so results are on screen. */
async function search(user: ReturnType<typeof userEvent.setup>) {
	await user.type(getSearchbox(), 'topic')
	await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(6))
}

describe('SearchDialog', () => {
	it('prompts before a query is entered', () => {
		renderDialog()

		expect(
			screen.getByText('Type to search your library.'),
		).toBeInTheDocument()
	})

	it('renders compact grouped previews and expands one group at a time', async () => {
		const user = userEvent.setup()
		renderDialog()
		await search(user)

		expect(screen.queryByText('Topic 3')).not.toBeInTheDocument()

		await user.click(
			screen.getAllByRole('button', { name: 'View all' })[0]!,
		)

		expect(screen.getAllByRole('link')).toHaveLength(4)
		expect(screen.getByText('Topic 3')).toBeInTheDocument()
		expect(
			screen.queryByRole('heading', { name: 'Cards (4)' }),
		).not.toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Collapse' }))

		expect(
			screen.getByRole('heading', { name: 'Cards (4)' }),
		).toBeInTheDocument()
		expect(screen.getAllByRole('link')).toHaveLength(6)
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
		expect(input).toHaveValue('topicx')
		await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(6))
	})

	it('closes through the dialog control', async () => {
		const user = userEvent.setup()
		const { onOpenChange } = renderDialog()

		await user.click(screen.getByRole('button', { name: 'Close' }))
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

		await user.type(getSearchbox(), 'topic')

		// The message renders twice: once in the live region, once inline.
		await waitFor(() =>
			expect(
				screen.getAllByText('Search could not load. Try again.'),
			).toHaveLength(2),
		)
	})
})
