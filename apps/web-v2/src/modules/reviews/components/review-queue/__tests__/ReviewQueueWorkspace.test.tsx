import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { DateString } from '~/types/date'

import { ReviewQueueWorkspace } from '../ReviewQueueWorkspace'

describe('ReviewQueueWorkspace', () => {
	it('starts with the queue open and toggles its visibility', async () => {
		const user = userEvent.setup()
		render(
			<ReviewQueueWorkspace
				cards={[]}
				title='Due'
				today={'2026-09-13' as DateString}
			/>,
		)

		const sidebar = screen.getByRole('complementary', { name: 'Due cards' })
		const closeButton = screen.getByRole('button', {
			name: 'Close queue',
			expanded: true,
		})
		expect(sidebar).toHaveAttribute('id', 'review-queue-sidebar')
		expect(closeButton).toHaveAttribute('aria-expanded', 'true')
		expect(closeButton).toHaveAttribute(
			'aria-controls',
			'review-queue-sidebar',
		)

		await user.click(closeButton)

		const openButton = screen.getByRole('button', {
			name: 'Open queue',
		})
		expect(openButton).toHaveAttribute('aria-expanded', 'false')
		expect(
			screen.queryByRole('complementary', { name: 'Due cards' }),
		).not.toBeInTheDocument()

		await user.click(openButton)

		expect(
			screen.getByRole('complementary', { name: 'Due cards' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Close queue', expanded: true }),
		).toBeInTheDocument()
	})

	it('closes the queue from the sidebar close button', async () => {
		const user = userEvent.setup()
		render(
			<ReviewQueueWorkspace
				cards={[]}
				title='Due'
				today={'2026-09-13' as DateString}
			/>,
		)

		const sidebar = screen.getByRole('complementary', { name: 'Due cards' })

		await user.click(
			within(sidebar).getByRole('button', { name: 'Close queue' }),
		)

		expect(
			screen.queryByRole('complementary', { name: 'Due cards' }),
		).not.toBeInTheDocument()

		const openButton = screen.getByRole('button', { name: 'Open queue' })
		expect(openButton).toBeInTheDocument()
		expect(openButton).toHaveFocus()

		await user.click(openButton)

		expect(
			screen.getByRole('complementary', { name: 'Due cards' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Close queue', expanded: true }),
		).toBeInTheDocument()
	})

	it('starts closed on small viewports', () => {
		vi.spyOn(window, 'matchMedia').mockReturnValue({
			matches: false,
			media: '(min-width: 768px)',
			onchange: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})

		render(
			<ReviewQueueWorkspace
				cards={[]}
				title='Due'
				today={'2026-09-13' as DateString}
			/>,
		)

		expect(
			screen.queryByRole('complementary', { name: 'Due cards' }),
		).not.toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Open queue' }),
		).toHaveAttribute('aria-expanded', 'false')
	})

	it('closes when the viewport becomes small', () => {
		let onViewportChange: ((event: MediaQueryListEvent) => void) | undefined
		vi.spyOn(window, 'matchMedia').mockReturnValue({
			matches: true,
			media: '(min-width: 768px)',
			onchange: null,
			addEventListener: vi.fn((_type, listener) => {
				onViewportChange = listener as (
					event: MediaQueryListEvent,
				) => void
			}),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})

		render(
			<ReviewQueueWorkspace
				cards={[]}
				title='Due'
				today={'2026-09-13' as DateString}
			/>,
		)

		expect(
			screen.getByRole('complementary', { name: 'Due cards' }),
		).toBeInTheDocument()

		act(() => {
			onViewportChange?.({ matches: false } as MediaQueryListEvent)
		})

		expect(
			screen.queryByRole('complementary', { name: 'Due cards' }),
		).not.toBeInTheDocument()
	})
})
