import type { DueEntry } from '@convex/validators/due'
import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { dueQueries } from '~/modules/reviews/api/dueQueries'
import { createTestQueryClient } from '~/testing/createTestQueryClient'
import { todayIso } from '~/utils/date'

import { ReviewSidebar } from '../ReviewSidebar'

vi.mock('@tanstack/react-router', () => ({
	Link: ({
		'aria-label': ariaLabel,
		children,
		to,
	}: {
		'aria-label'?: string
		children: ReactNode
		to: string
	}) => (
		<a aria-label={ariaLabel} href={to}>
			{children}
		</a>
	),
}))

describe('ReviewSidebar', () => {
	function renderSidebar({
		due = false,
		newCards = false,
		late = false,
	}: {
		due?: boolean
		newCards?: boolean
		late?: boolean
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

		return {
			...render(
				<QueryClientProvider client={queryClient}>
					<ReviewSidebar />
				</QueryClientProvider>,
			),
			queryClient,
			today,
		}
	}

	it('shows an accessible indicator for each nonempty queue', () => {
		renderSidebar({ due: true, late: true, newCards: true })

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
			document.querySelectorAll('[data-slot="status-dot"]'),
		).toHaveLength(3)
	})

	it('hides indicators for empty queues and reflects updated queue state', () => {
		const { queryClient, rerender, today } = renderSidebar({ due: true })

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
		rerender(
			<QueryClientProvider client={queryClient}>
				<ReviewSidebar />
			</QueryClientProvider>,
		)

		expect(screen.getByRole('link', { name: 'Due' })).toBeInTheDocument()
		expect(
			screen.getByRole('link', { name: 'New, cards available' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('link', { name: 'Late, cards available' }),
		).toBeInTheDocument()
		expect(
			document.querySelectorAll('[data-slot="status-dot"]'),
		).toHaveLength(2)
	})
})
