import type { Card } from '@convex/validators/cards'
import type { DueEntry } from '@convex/validators/due'
import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { cardQueries } from '~/modules/reviews/api/cardQueries'
import { dueQueries } from '~/modules/reviews/api/dueQueries'
import { createTestQueryClient } from '~/testing/createTestQueryClient'
import { todayIso } from '~/utils/date'

import { ReviewNavigation } from '../ReviewNavigation'

vi.mock('@tanstack/react-router', async importOriginal => ({
	...(await importOriginal<typeof import('@tanstack/react-router')>()),
	Link: ({
		children,
		to,
		...props
	}: ComponentProps<'a'> & { to?: string }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
}))

const entryFor = (id: string) => ({ card: { _id: id } }) as DueEntry

describe('ReviewNavigation', () => {
	function renderNavigation({
		due = 0,
		newCards = 0,
		lateEntries = [],
		flagged = 0,
	}: {
		due?: number
		newCards?: number
		lateEntries?: Array<DueEntry>
		flagged?: number
	} = {}) {
		const queryClient = createTestQueryClient()
		const today = todayIso()
		queryClient.setQueryData(
			dueQueries.listDue(today).queryKey,
			Array.from({ length: due }, (_, index) => entryFor(`due-${index}`)),
		)
		queryClient.setQueryData(
			dueQueries.listNew().queryKey,
			Array.from({ length: newCards }, (_, index) =>
				entryFor(`new-${index}`),
			),
		)
		queryClient.setQueryData(
			dueQueries.listLate(today).queryKey,
			lateEntries,
		)
		queryClient.setQueryData(
			cardQueries.listFlagged().queryKey,
			Array.from({ length: flagged }, (_, index) => ({
				_id: `flagged-${index}`,
			})) as Array<Card>,
		)

		return {
			...render(
				<QueryClientProvider client={queryClient}>
					<ReviewNavigation />
				</QueryClientProvider>,
			),
			queryClient,
			today,
		}
	}

	it('uses matching singular count labels and dots for each nonempty queue', () => {
		renderNavigation({
			due: 1,
			lateEntries: [entryFor('late-1')],
			newCards: 1,
			flagged: 1,
		})

		for (const name of [
			'1 card due',
			'1 new card',
			'1 late card',
			'1 flagged card',
		]) {
			expect(screen.getByRole('link', { name })).toBeInTheDocument()
		}
		expect(
			document.querySelectorAll('[data-slot="status-dot"]'),
		).toHaveLength(4)
	})

	it('uses plural count labels and deduplicates late cards for its label', () => {
		renderNavigation({
			due: 2,
			newCards: 3,
			lateEntries: [
				entryFor('late-1'),
				entryFor('late-1'),
				entryFor('late-2'),
			],
			flagged: 4,
		})

		for (const name of [
			'2 cards due',
			'3 new cards',
			'2 late cards',
			'4 flagged cards',
		]) {
			expect(screen.getByRole('link', { name })).toBeInTheDocument()
		}
	})

	it('hides indicators for empty queues and reflects updated queue state', async () => {
		const { queryClient, rerender, today } = renderNavigation({ due: 1 })

		expect(
			screen.getByRole('link', { name: '1 card due' }),
		).toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'New' })).toBeInTheDocument()
		expect(
			document.querySelectorAll('[data-slot="status-dot"]'),
		).toHaveLength(1)

		queryClient.setQueryData(dueQueries.listDue(today).queryKey, [])
		queryClient.setQueryData(dueQueries.listNew().queryKey, [
			{ card: { _id: 'new-1' } } as DueEntry,
		])
		queryClient.setQueryData(dueQueries.listLate(today).queryKey, [
			{ card: { _id: 'late-1' } } as DueEntry,
		])
		queryClient.setQueryData(cardQueries.listFlagged().queryKey, [
			{ _id: 'flagged-1' } as Card,
		])
		rerender(
			<QueryClientProvider client={queryClient}>
				<ReviewNavigation />
			</QueryClientProvider>,
		)

		await waitFor(() => {
			expect(
				screen.getByRole('link', { name: 'Due' }),
			).toBeInTheDocument()
			expect(
				screen.getByRole('link', { name: '1 new card' }),
			).toBeInTheDocument()
			expect(
				screen.getByRole('link', { name: '1 late card' }),
			).toBeInTheDocument()
			expect(
				screen.getByRole('link', { name: '1 flagged card' }),
			).toBeInTheDocument()
			expect(
				document.querySelectorAll('[data-slot="status-dot"]'),
			).toHaveLength(3)
		})
	})

	it('collapses and expands the review links from its section header', async () => {
		const user = userEvent.setup()
		renderNavigation()

		await user.click(
			screen.getByRole('button', { name: 'Collapse Review' }),
		)
		expect(
			screen.queryByRole('navigation', { name: 'review sections' }),
		).not.toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Expand Review' }))
		expect(
			screen.getByRole('navigation', { name: 'review sections' }),
		).toBeInTheDocument()
	})
})
