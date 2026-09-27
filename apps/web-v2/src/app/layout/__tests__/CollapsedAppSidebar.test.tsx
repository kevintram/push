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
	function renderSidebar({ due = false }: { due?: boolean } = {}) {
		const queryClient = createTestQueryClient()
		const today = todayIso()
		queryClient.setQueryData(
			dueQueries.listDue(today).queryKey,
			due ? ([{} as DueEntry] as Array<DueEntry>) : [],
		)
		queryClient.setQueryData(dueQueries.listNew().queryKey, [])
		queryClient.setQueryData(dueQueries.listLate(today).queryKey, [])
		queryClient.setQueryData(cardQueries.listFlagged().queryKey, [])

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

	it('announces available cards without making the status dot focusable', () => {
		renderSidebar({ due: true })

		expect(
			screen.getByRole('link', { name: 'Due, cards available' }),
		).toHaveAttribute('href', '/review/due')
		expect(
			document.querySelectorAll('[data-slot="status-dot"]'),
		).toHaveLength(1)
		expect(
			document.querySelector('[data-slot="status-dot"]'),
		).toHaveAttribute('aria-hidden', 'true')
		expect(screen.getByRole('link', { name: 'New' })).toBeInTheDocument()
	})

	it('shows right-side tooltip content for icon-only route links', async () => {
		const user = userEvent.setup()
		renderSidebar()

		await user.hover(screen.getByRole('link', { name: 'Due' }))
		expect(await screen.findByRole('tooltip')).toHaveTextContent('Due')
	})
})
