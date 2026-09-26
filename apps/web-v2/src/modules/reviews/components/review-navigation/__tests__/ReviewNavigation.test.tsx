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

describe('ReviewNavigation', () => {
	function renderNavigation({
		due = false,
		newCards = false,
		late = false,
		flagged = false,
	}: {
		due?: boolean
		newCards?: boolean
		late?: boolean
		flagged?: boolean
	} = {}) {
		const queryClient = createTestQueryClient()
		const today = todayIso()
		const entry = {} as DueEntry
		queryClient.setQueryData(
			dueQueries.listDue(today).queryKey,
			due ? [entry] : [],
		)
		queryClient.setQueryData(
			dueQueries.listNew().queryKey,
			newCards ? [entry] : [],
		)
		queryClient.setQueryData(
			dueQueries.listLate(today).queryKey,
			late ? [entry] : [],
		)
		queryClient.setQueryData(
			cardQueries.listFlagged().queryKey,
			flagged ? [{} as Card] : [],
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

	it('shows an accessible indicator for each nonempty queue', () => {
		renderNavigation({
			due: true,
			late: true,
			newCards: true,
			flagged: true,
		})

		expect(
			screen.getByRole('link', { name: 'Due, cards available' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('link', { name: 'New, cards available' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('link', { name: 'Late, cards available' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('link', { name: 'Flagged, cards available' }),
		).toHaveAttribute('href', '/review/flagged')
		expect(
			document.querySelectorAll('[data-slot="status-dot"]'),
		).toHaveLength(4)
	})

	it('hides indicators for empty queues and reflects updated queue state', async () => {
		const { queryClient, rerender, today } = renderNavigation({ due: true })

		expect(
			screen.getByRole('link', { name: 'Due, cards available' }),
		).toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'New' })).toBeInTheDocument()
		expect(
			document.querySelectorAll('[data-slot="status-dot"]'),
		).toHaveLength(1)

		queryClient.setQueryData(dueQueries.listDue(today).queryKey, [])
		queryClient.setQueryData(dueQueries.listNew().queryKey, [
			{} as DueEntry,
		])
		queryClient.setQueryData(dueQueries.listLate(today).queryKey, [
			{} as DueEntry,
		])
		queryClient.setQueryData(cardQueries.listFlagged().queryKey, [
			{} as Card,
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
				screen.getByRole('link', { name: 'New, cards available' }),
			).toBeInTheDocument()
			expect(
				screen.getByRole('link', { name: 'Late, cards available' }),
			).toBeInTheDocument()
			expect(
				screen.getByRole('link', { name: 'Flagged, cards available' }),
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
