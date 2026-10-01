import type { Card } from '@convex/validators/cards'
import type { DueEntry } from '@convex/validators/due'
import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '~/components/ui'
import { cardQueries } from '~/modules/reviews/api/cardQueries'
import { dueQueries } from '~/modules/reviews/api/dueQueries'
import { HideModeProvider } from '~/modules/reviews/hide-mode/HideModeProvider'
import { createTestQueryClient } from '~/testing/createTestQueryClient'
import { todayIso } from '~/utils/date'

import { CollapsedAppSidebar } from '../CollapsedAppSidebar'

vi.mock('@tanstack/react-router', async importOriginal => ({
	...(await importOriginal<typeof import('@tanstack/react-router')>()),
	Link: ({
		children,
		to,
		activeOptions,
		...props
	}: ComponentProps<'a'> & {
		to?: string
		activeOptions?: { exact?: boolean }
	}) => (
		<a href={to} data-exact={activeOptions?.exact} {...props}>
			{children}
		</a>
	),
}))

vi.mock('~/modules/reviews/components/HideModeButton', () => ({
	HideModeButton: () => <button aria-label='Hide mode' type='button' />,
}))

vi.mock('~/modules/search/components/SearchDialog', () => ({
	SearchDialog: () => <button aria-label='Search' type='button' />,
}))

describe('CollapsedAppSidebar', () => {
	function renderSidebar({
		due = 0,
		newCards = 0,
		late = 0,
		lateEntries,
		flagged = 0,
	}: {
		due?: number
		newCards?: number
		late?: number
		lateEntries?: Array<DueEntry>
		flagged?: number
	} = {}) {
		const queryClient = createTestQueryClient()
		const today = todayIso()
		queryClient.setQueryData(
			dueQueries.listDue(today).queryKey,
			Array.from({ length: due }, () => ({}) as DueEntry),
		)
		queryClient.setQueryData(
			dueQueries.listNew().queryKey,
			Array.from({ length: newCards }, () => ({}) as DueEntry),
		)
		queryClient.setQueryData(
			dueQueries.listLate(today).queryKey,
			lateEntries ??
				Array.from(
					{ length: late },
					(_, index) =>
						({ card: { _id: `late-${index}` } }) as DueEntry,
				),
		)
		queryClient.setQueryData(
			cardQueries.listFlagged().queryKey,
			Array.from({ length: flagged }, () => ({}) as Card),
		)

		return render(
			<QueryClientProvider client={queryClient}>
				<TooltipProvider delay={0}>
					<HideModeProvider>
						<CollapsedAppSidebar
							hideMode={false}
							id='app-sidebar'
							expanded={false}
							onToggle={() => {}}
							toggleRef={null}
						/>
					</HideModeProvider>
				</TooltipProvider>
			</QueryClientProvider>,
		)
	}

	it('renders the ordered icon rail without Library', () => {
		renderSidebar()

		const nav = screen.getByRole('navigation', { name: 'primary' })
		const toggle = screen.getByRole('button', { name: 'Expand sidebar' })
		const hideMode = screen.getByRole('button', { name: 'Hide mode' })
		const search = screen.getByRole('button', { name: 'Search' })
		const due = screen.getByRole('link', { name: 'Due' })
		const newLink = screen.getByRole('link', { name: 'New' })
		const late = screen.getByRole('link', { name: 'Late' })
		const flagged = screen.getByRole('link', { name: 'Flagged' })
		const settings = screen.getByRole('link', { name: 'Settings' })

		expect(toggle).toBeEnabled()
		expect(toggle).toHaveAttribute('aria-expanded', 'false')
		expect(toggle).toHaveAttribute('aria-controls', 'app-sidebar')
		expect(
			toggle.compareDocumentPosition(hideMode) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy()
		expect(
			hideMode.compareDocumentPosition(search) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy()
		expect(
			search.compareDocumentPosition(due) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy()
		expect(due).toHaveAttribute('href', '/review/due')
		expect(newLink).toHaveAttribute('href', '/review/new')
		expect(late).toHaveAttribute('href', '/review/late')
		expect(flagged).toHaveAttribute('href', '/review/flagged')
		expect(settings).toHaveAttribute('href', '/settings')
		expect(settings).toHaveAttribute('data-exact', 'true')
		expect(nav).not.toHaveTextContent('Library')
		expect(
			screen.queryByRole('navigation', { name: /library/i }),
		).not.toBeInTheDocument()
	})

	it('uses base labels and hides dots for empty queues', () => {
		renderSidebar()

		for (const label of ['Due', 'New', 'Late', 'Flagged']) {
			expect(
				screen.getByRole('link', { name: label }),
			).toBeInTheDocument()
		}
		expect(
			document.querySelectorAll('[data-slot="status-dot"]'),
		).toHaveLength(0)
	})

	it('maps singular queue counts to tooltip, accessible label, and status dot', async () => {
		const user = userEvent.setup()
		renderSidebar({ due: 1, newCards: 1, late: 1, flagged: 1 })

		const labels = [
			'1 card due',
			'1 new card',
			'1 late card',
			'1 flagged card',
		]
		const links = labels.map(label =>
			screen.getByRole('link', { name: label }),
		)
		expect(
			document.querySelectorAll('[data-slot="status-dot"]'),
		).toHaveLength(4)
		for (const [index, link] of links.entries()) {
			const label = labels[index] ?? ''
			expect(link).toHaveAttribute('aria-label', label)
			expect(
				link.querySelector('[data-slot="status-dot"]'),
			).toHaveAttribute('aria-hidden', 'true')
			await user.hover(link)
			expect(await screen.findByRole('tooltip')).toHaveTextContent(label)
			await user.unhover(link)
		}
	})

	it('uses plural counts and deduplicates late cards for its count', async () => {
		const user = userEvent.setup()
		renderSidebar({
			due: 2,
			newCards: 3,
			lateEntries: [
				{ card: { _id: 'late-1' } } as DueEntry,
				{ card: { _id: 'late-1' } } as DueEntry,
				{ card: { _id: 'late-2' } } as DueEntry,
				{ card: { _id: 'late-2' } } as DueEntry,
			],
			flagged: 5,
		})

		const labels = [
			'2 cards due',
			'3 new cards',
			'2 late cards',
			'5 flagged cards',
		]
		const links = labels.map(label =>
			screen.getByRole('link', { name: label }),
		)
		expect(
			document.querySelectorAll('[data-slot="status-dot"]'),
		).toHaveLength(4)
		for (const [index, link] of links.entries()) {
			const label = labels[index] ?? ''
			expect(link).toHaveAttribute('aria-label', label)
			await user.hover(link)
			expect(await screen.findByRole('tooltip')).toHaveTextContent(label)
			await user.unhover(link)
		}
	})

	it('shows right-side tooltip content for icon-only route links', async () => {
		const user = userEvent.setup()
		renderSidebar()

		await user.hover(screen.getByRole('link', { name: 'Due' }))
		expect(await screen.findByRole('tooltip')).toHaveTextContent('Due')
	})
})
