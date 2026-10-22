import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Ref } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { collectionQueries } from '~/modules/collections/api/collectionQueries'
import { HideModeProvider } from '~/modules/reviews/hide-mode/HideModeProvider'
import { useHideMode } from '~/modules/reviews/hide-mode/useHideMode'
import { createTestQueryClient } from '~/testing/createTestQueryClient'

import { AppShell } from '../AppShell'

type SidebarMockProps = {
	navId: string
	onToggle: () => void
	toggleRef: Ref<HTMLButtonElement>
}

vi.mock('../CollapsedAppSidebar', () => ({
	CollapsedAppSidebar: ({ navId, onToggle, toggleRef }: SidebarMockProps) => (
		<div data-testid='icon-only-rail'>
			<button
				aria-controls={navId}
				aria-expanded={false}
				aria-label='Expand sidebar'
				onClick={onToggle}
				ref={toggleRef}
				type='button'
			/>
		</div>
	),
}))

vi.mock('../ExpandedAppSidebar', () => ({
	ExpandedAppSidebar: ({ navId, onToggle, toggleRef }: SidebarMockProps) => (
		<div data-testid='expanded-sidebar'>
			<button
				aria-controls={navId}
				aria-expanded
				aria-label='Collapse sidebar'
				onClick={onToggle}
				ref={toggleRef}
				type='button'
			/>
			<div>Collections</div>
		</div>
	),
}))

const SIDEBAR_STORAGE_KEY = 'appSidebarExpanded'

function HideModeToggle() {
	const { toggleHideMode } = useHideMode()

	return <button onClick={toggleHideMode}>Toggle hide mode</button>
}

function renderShell() {
	const queryClient = createTestQueryClient()
	queryClient.setQueryData(collectionQueries.list().queryKey, [])

	const view = render(
		<QueryClientProvider client={queryClient}>
			<HideModeProvider>
				<HideModeToggle />
				<AppShell>
					<div>Main content</div>
				</AppShell>
			</HideModeProvider>
		</QueryClientProvider>,
	)
	return { ...view, queryClient }
}

describe('AppShell', () => {
	beforeEach(() => {
		window.localStorage.clear()
		sessionStorage.setItem('hideMode', 'off')
	})

	it('starts collapsed and marks the shell when hide mode is enabled', () => {
		renderShell()

		const shell = screen.getByRole('main').parentElement
		const toggle = screen.getByRole('button', { name: 'Expand sidebar' })
		expect(shell).toHaveAttribute('data-hide-mode', 'off')
		const nav = screen.getByRole('navigation', { name: 'primary' })
		expect(nav).toHaveAttribute('id', 'app-sidebar')
		expect(nav).toContainElement(screen.getByTestId('icon-only-rail'))
		expect(toggle).toHaveAttribute('aria-expanded', 'false')
		expect(toggle).toHaveAttribute('aria-controls', 'app-sidebar')
		expect(screen.queryByTestId('expanded-sidebar')).not.toBeInTheDocument()
		expect(window.localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBeNull()

		fireEvent.click(
			screen.getByRole('button', { name: 'Toggle hide mode' }),
		)
		expect(shell).toHaveAttribute('data-hide-mode', 'on')
		fireEvent.click(
			screen.getByRole('button', { name: 'Toggle hide mode' }),
		)
		expect(shell).toHaveAttribute('data-hide-mode', 'off')
	})

	it('subscribes to the collection list while collapsed', () => {
		const { queryClient } = renderShell()

		expect(screen.getByTestId('icon-only-rail')).toBeInTheDocument()
		const query = queryClient
			.getQueryCache()
			.find({ queryKey: collectionQueries.list().queryKey })
		expect(query?.getObserversCount()).toBe(1)
	})

	it('switches presentations, persists preference, and restores focus each way', () => {
		renderShell()

		fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }))
		const collapseToggle = screen.getByRole('button', {
			name: 'Collapse sidebar',
		})
		expect(collapseToggle).toHaveFocus()
		expect(collapseToggle).toHaveAttribute('aria-expanded', 'true')
		expect(collapseToggle).toHaveAttribute('aria-controls', 'app-sidebar')
		expect(window.localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('true')
		expect(screen.getByTestId('expanded-sidebar')).toHaveTextContent(
			'Collections',
		)
		expect(
			screen.getByRole('navigation', { name: 'primary' }),
		).toContainElement(screen.getByTestId('expanded-sidebar'))
		expect(screen.queryByTestId('icon-only-rail')).not.toBeInTheDocument()

		fireEvent.click(collapseToggle)
		const expandToggle = screen.getByRole('button', {
			name: 'Expand sidebar',
		})
		expect(expandToggle).toHaveFocus()
		expect(expandToggle).toHaveAttribute('aria-expanded', 'false')
		expect(window.localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('false')
		expect(screen.getByTestId('icon-only-rail')).toBeInTheDocument()
		expect(screen.queryByTestId('expanded-sidebar')).not.toBeInTheDocument()
	})

	it('restores the expanded presentation from localStorage', () => {
		window.localStorage.setItem(SIDEBAR_STORAGE_KEY, 'true')

		renderShell()

		const collapseToggle = screen.getByRole('button', {
			name: 'Collapse sidebar',
		})
		expect(collapseToggle).toHaveAttribute('aria-expanded', 'true')
		expect(screen.getByTestId('expanded-sidebar')).toBeInTheDocument()
		expect(screen.queryByTestId('icon-only-rail')).not.toBeInTheDocument()
	})

	it('toggles with Mod+B without moving focus', () => {
		renderShell()
		const outside = screen.getByRole('button', { name: 'Toggle hide mode' })
		outside.focus()

		fireEvent.keyDown(document, { key: 'b', code: 'KeyB', ctrlKey: true })
		expect(screen.getByTestId('expanded-sidebar')).toBeInTheDocument()
		expect(window.localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('true')
		expect(outside).toHaveFocus()

		// Modifier still held and no keyup for B, as on macOS.
		fireEvent.keyDown(document, { key: 'b', code: 'KeyB', ctrlKey: true })
		expect(screen.getByTestId('icon-only-rail')).toBeInTheDocument()
		expect(window.localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('false')
		expect(outside).toHaveFocus()
	})

	it('moves focus to the new toggle when Mod+B fires from the toggle', () => {
		renderShell()
		screen.getByRole('button', { name: 'Expand sidebar' }).focus()

		fireEvent.keyDown(document, { key: 'b', code: 'KeyB', ctrlKey: true })
		expect(
			screen.getByRole('button', { name: 'Collapse sidebar' }),
		).toHaveFocus()
	})

	it('ignores auto-repeat while Mod+B is held', () => {
		renderShell()

		fireEvent.keyDown(document, { key: 'b', code: 'KeyB', ctrlKey: true })
		fireEvent.keyDown(document, {
			key: 'b',
			code: 'KeyB',
			ctrlKey: true,
			repeat: true,
		})
		expect(screen.getByTestId('expanded-sidebar')).toBeInTheDocument()
	})
})
