import { fireEvent, render, screen } from '@testing-library/react'
import type { Ref } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HideModeProvider } from '~/modules/reviews/hide-mode/HideModeProvider'
import { useHideMode } from '~/modules/reviews/hide-mode/useHideMode'

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
			<div>Library</div>
		</div>
	),
}))

const SIDEBAR_STORAGE_KEY = 'appSidebarExpanded'

function HideModeToggle() {
	const { toggleHideMode } = useHideMode()

	return <button onClick={toggleHideMode}>Toggle hide mode</button>
}

function renderShell() {
	return render(
		<HideModeProvider>
			<HideModeToggle />
			<AppShell>
				<div>Main content</div>
			</AppShell>
		</HideModeProvider>,
	)
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
			'Library',
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
})
