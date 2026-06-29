import { fireEvent, render, screen } from '@testing-library/react'
import { type ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SidebarProvider } from '~/components/ui/sidebar'
import { AppSidebar } from '~/modules/shell/sidebar/AppSidebar'

const collapseAllMock = vi.fn()
const navigateMock = vi.fn()

vi.mock('@tanstack/react-router', () => ({
	Link: ({
		children,
		to,
		...props
	}: ComponentProps<'a'> & { to: string }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
	useNavigate: () => navigateMock,
}))

vi.mock('~/modules/shell/sidebar/SidebarTopicTree', () => ({
	SidebarTopicTree: ({
		onCollapseAllReady,
	}: {
		onCollapseAllReady?: (collapseAll: () => void) => void
	}) => {
		onCollapseAllReady?.(collapseAllMock)
		return <div data-testid='sidebar-topic-tree' />
	},
}))

describe('AppSidebar', () => {
	beforeEach(() => {
		collapseAllMock.mockReset()
		navigateMock.mockReset()
	})

	it('renders only the library navigation surface', () => {
		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		)

		expect(
			screen.getByRole('link', { name: /^Library$/u }),
		).toHaveAttribute('href', '/library')
		expect(screen.getByTestId('sidebar-topic-tree')).toBeInTheDocument()
		expect(
			screen.queryByRole('link', { name: /reviews/iu }),
		).not.toBeInTheDocument()
		expect(
			screen.queryByRole('link', { name: /practice/iu }),
		).not.toBeInTheDocument()
		expect(
			screen.queryByRole('link', { name: /flashcards/iu }),
		).not.toBeInTheDocument()
		expect(
			screen.queryByRole('link', { name: /flagged/iu }),
		).not.toBeInTheDocument()
		expect(
			screen.queryByRole('link', { name: /recent/iu }),
		).not.toBeInTheDocument()
		expect(
			screen.queryByRole('link', { name: /logbook/iu }),
		).not.toBeInTheDocument()
	})

	it('does not render a sidebar-owned trigger or close affordance', () => {
		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		)

		expect(
			screen.queryByRole('button', { name: /open sidebar/iu }),
		).not.toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: /close sidebar/iu }),
		).not.toBeInTheDocument()
	})

	it('navigates to library with create search param when add topic is clicked', () => {
		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		)

		fireEvent.click(screen.getByRole('button', { name: 'Add topic' }))

		expect(navigateMock).toHaveBeenCalledWith({
			to: '/library',
			search: { create: true },
		})
	})

	it('wires the collapse-all topic action to the topic tree', () => {
		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		)

		fireEvent.click(
			screen.getByRole('button', { name: 'Collapse all topics' }),
		)

		expect(collapseAllMock).toHaveBeenCalledTimes(1)
	})

	it('uses off-canvas collapse instead of an icon rail', () => {
		render(
			<SidebarProvider defaultOpen={false}>
				<AppSidebar />
			</SidebarProvider>,
		)

		expect(
			document.querySelector('[data-collapsible="offcanvas"]'),
		).toBeTruthy()
		expect(document.querySelector('[data-collapsible="icon"]')).toBeNull()
	})
})
