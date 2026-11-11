import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ReviewComposerDockProps } from '~/modules/reviews/components/reviewComposerContext'
import type { Card } from '~/modules/reviews/types/review.types'
import type { DateString } from '~/types/date'

import { ReviewQueueWorkspace } from '../ReviewQueueWorkspace'

// Stands in for the card so tests can see where its dock starts and move it.
vi.mock('~/modules/reviews/components/card-detail/CardDetailView', () => ({
	CardDetailView: ({
		defaultDock,
		onDockChange,
	}: ReviewComposerDockProps) => (
		<>
			<output aria-label='Starting dock'>
				{JSON.stringify(defaultDock)}
			</output>
			<button
				type='button'
				onClick={() =>
					onDockChange?.({ state: 'open', isExpanded: true })
				}
			>
				Expand dock
			</button>
			<button
				type='button'
				onClick={() =>
					onDockChange?.({ state: 'minimized', isExpanded: true })
				}
			>
				Minimize expanded dock
			</button>
		</>
	),
}))
vi.mock('~/modules/reviews/components/CardItem', () => ({
	CardItem: () => null,
}))
vi.mock('~/modules/reviews/utils/cardSrs', () => ({
	deriveCardSrsState: () => ({}),
}))

const STORAGE_KEY = 'reviewQueueSidebarOpen'
const queueCards = [
	{ _id: 'card-1', prompt: 'First' },
	{ _id: 'card-2', prompt: 'Second' },
] as unknown as ReadonlyArray<Card>

function startingDock() {
	return JSON.parse(
		screen.getByRole('status', { name: 'Starting dock' }).textContent ?? '',
	)
}

describe('ReviewQueueWorkspace', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('starts with the queue open and toggles its visibility', async () => {
		const user = userEvent.setup()
		render(
			<ReviewQueueWorkspace
				cards={[]}
				title='Due'
				today={'2026-09-13' as DateString}
			/>,
		)

		const sidebar = screen.getByRole('complementary', { name: 'Queue' })
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
		expect(window.localStorage.getItem(STORAGE_KEY)).toBe('false')

		const openButton = screen.getByRole('button', {
			name: 'Open queue',
		})
		expect(openButton).toHaveAttribute('aria-expanded', 'false')
		expect(
			screen.queryByRole('complementary', { name: 'Queue' }),
		).not.toBeInTheDocument()

		await user.click(openButton)
		expect(window.localStorage.getItem(STORAGE_KEY)).toBe('true')

		expect(
			screen.getByRole('complementary', { name: 'Queue' }),
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

		const sidebar = screen.getByRole('complementary', { name: 'Queue' })

		await user.click(
			within(sidebar).getByRole('button', { name: 'Close queue' }),
		)
		expect(window.localStorage.getItem(STORAGE_KEY)).toBe('false')

		expect(
			screen.queryByRole('complementary', { name: 'Queue' }),
		).not.toBeInTheDocument()

		const openButton = screen.getByRole('button', { name: 'Open queue' })
		expect(openButton).toBeInTheDocument()
		expect(openButton).toHaveFocus()

		await user.click(openButton)

		expect(
			screen.getByRole('complementary', { name: 'Queue' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Close queue', expanded: true }),
		).toBeInTheDocument()
	})

	it('starts closed on small viewports', () => {
		window.localStorage.setItem(STORAGE_KEY, 'true')
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
			screen.queryByRole('complementary', { name: 'Queue' }),
		).not.toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Open queue' }),
		).toHaveAttribute('aria-expanded', 'false')
		expect(window.localStorage.getItem(STORAGE_KEY)).toBe('true')
	})

	it('does not overwrite the preference from small viewports', async () => {
		window.localStorage.setItem(STORAGE_KEY, 'true')
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
		const user = userEvent.setup()
		render(
			<ReviewQueueWorkspace
				cards={[]}
				title='Due'
				today={'2026-09-13' as DateString}
			/>,
		)

		await user.click(screen.getByRole('button', { name: 'Open queue' }))
		await user.click(
			within(
				screen.getByRole('complementary', { name: 'Queue' }),
			).getByRole('button', { name: 'Close queue' }),
		)

		expect(
			screen.queryByRole('complementary', { name: 'Queue' }),
		).not.toBeInTheDocument()
		expect(window.localStorage.getItem(STORAGE_KEY)).toBe('true')
	})

	it('closes when the viewport becomes small', () => {
		window.localStorage.setItem(STORAGE_KEY, 'true')
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
			screen.getByRole('complementary', { name: 'Queue' }),
		).toBeInTheDocument()

		act(() => {
			onViewportChange?.({ matches: false } as MediaQueryListEvent)
		})

		expect(
			screen.queryByRole('complementary', { name: 'Queue' }),
		).not.toBeInTheDocument()
		expect(window.localStorage.getItem(STORAGE_KEY)).toBe('true')
	})

	it.each(['New', 'Late', 'Flagged', 'Due'])(
		'restores the shared preference when returning to %s',
		async title => {
			const user = userEvent.setup()
			const props = { cards: [], today: '2026-09-13' as DateString }
			const first = render(
				<ReviewQueueWorkspace {...props} title='Due' />,
			)
			await user.click(
				screen.getByRole('button', {
					name: 'Close queue',
					expanded: true,
				}),
			)
			first.unmount()

			const second = render(
				<ReviewQueueWorkspace {...props} title={title} />,
			)
			expect(
				screen.getByRole('button', { name: 'Open queue' }),
			).toHaveAttribute('aria-expanded', 'false')
			await user.click(screen.getByRole('button', { name: 'Open queue' }))
			second.unmount()

			render(<ReviewQueueWorkspace {...props} title={title} />)
			expect(
				screen.getByRole('complementary', { name: 'Queue' }),
			).toBeInTheDocument()
		},
	)

	it('uses the viewport default for an invalid preference', () => {
		window.localStorage.setItem(STORAGE_KEY, 'invalid')
		render(
			<ReviewQueueWorkspace
				cards={[]}
				title='Due'
				today={'2026-09-13' as DateString}
			/>,
		)
		expect(
			screen.getByRole('complementary', { name: 'Queue' }),
		).toBeInTheDocument()
	})

	it('keeps manual controls usable when storage is unavailable', async () => {
		vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
			throw new Error('Storage unavailable')
		})
		vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
			throw new Error('Storage unavailable')
		})
		const user = userEvent.setup()
		render(
			<ReviewQueueWorkspace
				cards={[]}
				title='Due'
				today={'2026-09-13' as DateString}
			/>,
		)
		await user.click(
			screen.getByRole('button', { name: 'Close queue', expanded: true }),
		)
		expect(
			screen.getByRole('button', { name: 'Open queue' }),
		).toBeInTheDocument()
		await user.click(screen.getByRole('button', { name: 'Open queue' }))
		expect(
			screen.getByRole('complementary', { name: 'Queue' }),
		).toBeInTheDocument()
	})
	it('opens the next card docked when the dialog was open', async () => {
		const user = userEvent.setup()
		render(
			<ReviewQueueWorkspace
				cards={queueCards}
				title='Due'
				today={'2026-09-13' as DateString}
			/>,
		)
		expect(startingDock()).toEqual({ state: 'open', isExpanded: false })

		await user.click(screen.getByRole('button', { name: 'Expand dock' }))
		await user.click(screen.getByRole('button', { name: 'Next card' }))
		expect(startingDock()).toEqual({ state: 'open', isExpanded: false })
	})

	it('carries a minimized dialog to the next card', async () => {
		const user = userEvent.setup()
		render(
			<ReviewQueueWorkspace
				cards={queueCards}
				title='Due'
				today={'2026-09-13' as DateString}
			/>,
		)

		await user.click(
			screen.getByRole('button', { name: 'Minimize expanded dock' }),
		)
		await user.click(screen.getByRole('button', { name: 'Next card' }))
		expect(startingDock()).toEqual({ state: 'minimized', isExpanded: true })
	})
})
