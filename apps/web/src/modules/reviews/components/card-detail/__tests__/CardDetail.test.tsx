import type { Id } from '@convex/_generated/dataModel'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '~/components/ui'

import { CardDetail, type CardTab } from '../CardDetail'

const mutation = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }))
const cardActionsRender = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-query', () => ({
	useSuspenseQuery: ({ queryKey }: { queryKey: Array<string> }) => ({
		data: queryKey[0] === 'card' ? { primaryText: 'Card' } : [],
	}),
}))
vi.mock('../../../api/cardQueries', () => ({
	cardQueries: { detail: () => ({ queryKey: ['card'] }) },
}))
vi.mock('../../../api/reviewQueries', () => ({
	reviewQueries: { listByCard: () => ({ queryKey: ['reviews'] }) },
	useCreateReview: () => mutation,
}))
vi.mock('../../../utils/cardSrs', () => ({ deriveCardSrsState: () => ({}) }))
vi.mock('../../CardActions', () => ({
	CardActions: ({ showGoToCard }: { showGoToCard?: boolean }) => {
		cardActionsRender(showGoToCard)
		return null
	},
}))
vi.mock('../CardBreadcrumbs', () => ({ CardBreadcrumbs: () => null }))
vi.mock('../CardOverview', () => ({ CardOverview: () => null }))
vi.mock('../CardPropertiesPanel', () => ({ CardPropertiesPanel: () => null }))
vi.mock('../CardReviewsPanel', () => ({ CardReviewsPanel: () => null }))
vi.mock('../../RatingPicker', () => ({
	RatingPicker: ({
		rating,
		onSetRating,
		ref,
	}: {
		rating?: number
		onSetRating: (value: number) => void
		ref?: React.Ref<HTMLButtonElement>
	}) => (
		<button type='button' onClick={() => onSetRating(3)} ref={ref}>
			Rating {rating ?? 'none'}
		</button>
	),
}))
vi.mock('../../ReviewDatePicker', () => ({
	ReviewDatePicker: ({
		date,
		onDateChange,
	}: {
		date: string | null
		onDateChange: (value: string) => void
	}) => (
		<button type='button' onClick={() => onDateChange('2026-09-01')}>
			Date {date ?? 'none'}
		</button>
	),
}))

const firstCard = 'card-1' as Id<'cards'>
const secondCard = 'card-2' as Id<'cards'>
const STORAGE_KEY = 'cardDetailSidebarOpen'

function detail(tab: CardTab, cardId = firstCard, showGoToCard = false) {
	return (
		<TooltipProvider delay={0}>
			<CardDetail
				cardId={cardId}
				activeTab={tab}
				onTabChange={() => {}}
				showGoToCard={showGoToCard}
			/>
		</TooltipProvider>
	)
}

function description() {
	return screen.getByRole('textbox', { name: 'Review description' })
}

function ratingPicker() {
	return screen.getByRole('button', { name: /^Rating / })
}

function notes() {
	return screen.getByRole('textbox', { name: 'Review notes' })
}

// The minimized dock's title shares this name, and comes after the toolbar.
function newReviewToggle() {
	const [toggle] = screen.getAllByRole('button', { name: 'New review' })
	if (!toggle) throw new Error('New review toggle not found')
	return toggle
}

function submitButton() {
	return screen.getByRole('button', { name: 'Create review' })
}

function openDock() {
	fireEvent.click(newReviewToggle())
	return screen.getByRole('region', { name: 'New review' })
}

function queryDock() {
	return screen.queryByRole('region', { name: 'New review' })
}

function closeDock() {
	fireEvent.click(
		screen.getByRole('button', { name: 'Close review composer' }),
	)
}

describe('CardDetail review composer', () => {
	beforeEach(() => {
		window.localStorage.clear()
		mutation.mutate.mockReset()
		mutation.isPending = false
		cardActionsRender.mockReset()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('forwards the go-to-card visibility to CardActions', () => {
		render(detail('overview', firstCard, true))

		expect(cardActionsRender).toHaveBeenCalledWith(true)
	})

	it('toggles the card details sidebar accessibly', () => {
		render(detail('overview'))

		const sidebarToggle = screen.getByRole('button', {
			name: 'Hide details',
		})
		const sidebar = screen.getByRole('complementary', {
			name: 'Card details',
		})
		expect(sidebarToggle).toHaveAttribute('aria-expanded', 'true')
		expect(sidebarToggle).toHaveAttribute('aria-controls', sidebar.id)

		fireEvent.click(sidebarToggle)
		expect(window.localStorage.getItem(STORAGE_KEY)).toBe('false')
		expect(
			screen.getByRole('button', { name: 'Show details' }),
		).toHaveAttribute('aria-expanded', 'false')
		expect(
			screen.queryByRole('complementary', { name: 'Card details' }),
		).not.toBeInTheDocument()

		fireEvent.click(screen.getByRole('button', { name: 'Show details' }))
		expect(window.localStorage.getItem(STORAGE_KEY)).toBe('true')
		expect(
			screen.getByRole('complementary', { name: 'Card details' }),
		).toBeInTheDocument()
	})

	it('remembers details visibility across cards, queue and standalone mounts', () => {
		const queueCard = render(detail('overview', firstCard, true))
		fireEvent.click(screen.getByRole('button', { name: 'Hide details' }))
		queueCard.unmount()

		const nextCard = render(detail('overview', secondCard, true))
		expect(
			screen.getByRole('button', { name: 'Show details' }),
		).toHaveAttribute('aria-expanded', 'false')
		expect(
			screen.queryByRole('complementary', { name: 'Card details' }),
		).not.toBeInTheDocument()
		nextCard.unmount()

		const standaloneCard = render(detail('reviews', firstCard))
		expect(
			screen.getByRole('button', { name: 'Show details' }),
		).toBeInTheDocument()
		fireEvent.click(screen.getByRole('button', { name: 'Show details' }))
		standaloneCard.unmount()

		render(detail('overview', secondCard, true))
		expect(
			screen.getByRole('complementary', { name: 'Card details' }),
		).toBeInTheDocument()
	})

	it('keeps the details preference independent of the queue sidebar', () => {
		window.localStorage.setItem('reviewQueueSidebarOpen', 'false')
		render(detail('overview'))
		expect(
			screen.getByRole('complementary', { name: 'Card details' }),
		).toBeInTheDocument()
		fireEvent.click(screen.getByRole('button', { name: 'Hide details' }))
		fireEvent.click(screen.getByRole('button', { name: 'Show details' }))
		expect(window.localStorage.getItem('reviewQueueSidebarOpen')).toBe(
			'false',
		)
	})

	it('defaults to open for an invalid stored preference', () => {
		window.localStorage.setItem(STORAGE_KEY, 'invalid')
		render(detail('overview'))
		expect(
			screen.getByRole('complementary', { name: 'Card details' }),
		).toBeInTheDocument()
	})

	it('keeps the toggle usable when storage is unavailable', () => {
		vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
			throw new Error('Storage unavailable')
		})
		vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
			throw new Error('Storage unavailable')
		})
		render(detail('overview'))
		fireEvent.click(screen.getByRole('button', { name: 'Hide details' }))
		expect(
			screen.queryByRole('complementary', { name: 'Card details' }),
		).not.toBeInTheDocument()
		fireEvent.click(screen.getByRole('button', { name: 'Show details' }))
		expect(
			screen.getByRole('complementary', { name: 'Card details' }),
		).toBeInTheDocument()
	})

	it('opens the docked composer from New review', () => {
		render(detail('overview'))
		expect(queryDock()).not.toBeInTheDocument()

		const dock = openDock()
		expect(within(dock).getByRole('form', { name: 'Add review' }))
		expect(ratingPicker()).toHaveFocus()
		expect(
			within(dock).queryByRole('button', { name: 'Cancel' }),
		).not.toBeInTheDocument()
	})

	it('offers New review on Reviews without an inline composer', () => {
		render(detail('reviews'))
		expect(
			screen.queryByRole('form', { name: 'Add review' }),
		).not.toBeInTheDocument()

		openDock()
		expect(ratingPicker()).toHaveFocus()
	})

	it('starts where the caller left the dock and reports moves', () => {
		const onDockChange = vi.fn()
		render(
			<TooltipProvider delay={0}>
				<CardDetail
					cardId={firstCard}
					activeTab='overview'
					onTabChange={() => {}}
					defaultDock={{ state: 'open', isExpanded: false }}
					onDockChange={onDockChange}
				/>
			</TooltipProvider>,
		)
		expect(queryDock()).toBeInTheDocument()
		expect(ratingPicker()).toHaveFocus()

		fireEvent.click(newReviewToggle())
		expect(onDockChange).toHaveBeenLastCalledWith({
			state: 'minimized',
			isExpanded: false,
		})
		fireEvent.click(newReviewToggle())
		expect(onDockChange).toHaveBeenLastCalledWith({
			state: 'open',
			isExpanded: false,
		})

		// Creating a review closes the dock without hiding it for later cards.
		onDockChange.mockClear()
		fireEvent.change(description(), { target: { value: 'Submit me' } })
		fireEvent.click(submitButton())
		act(() => mutation.mutate.mock.calls[0]?.[1].onSuccess())
		expect(queryDock()).not.toBeInTheDocument()
		expect(onDockChange).not.toHaveBeenCalled()
	})

	it('keeps the draft while minimized and restores from the title', () => {
		render(detail('overview'))
		openDock()
		fireEvent.change(description(), { target: { value: 'Keep me' } })

		fireEvent.click(
			screen.getByRole('button', { name: 'Minimize review composer' }),
		)
		expect(
			screen.queryByRole('textbox', { name: 'Review description' }),
		).not.toBeInTheDocument()

		fireEvent.click(
			within(
				screen.getByRole('region', { name: 'New review' }),
			).getByRole('button', { name: 'New review' }),
		)
		expect(description()).toHaveValue('Keep me')
	})

	it('toggles between open and minimized from New review', () => {
		render(detail('overview'))
		openDock()
		fireEvent.change(description(), { target: { value: 'Keep me' } })

		fireEvent.click(newReviewToggle())
		expect(
			screen.queryByRole('textbox', { name: 'Review description' }),
		).not.toBeInTheDocument()
		expect(queryDock()).toBeInTheDocument()

		fireEvent.click(newReviewToggle())
		expect(description()).toHaveValue('Keep me')
	})

	it('restores a minimized dialog to the dialog', () => {
		render(detail('overview'))
		openDock()
		fireEvent.change(description(), { target: { value: 'Big draft' } })
		fireEvent.click(
			screen.getByRole('button', { name: 'Expand review composer' }),
		)
		fireEvent.click(
			screen.getByRole('button', { name: 'Minimize review composer' }),
		)
		expect(
			screen.queryByRole('dialog', { name: 'New review' }),
		).not.toBeInTheDocument()

		fireEvent.click(
			within(
				screen.getByRole('region', { name: 'New review' }),
			).getByRole('button', { name: 'New review' }),
		)
		const dialog = screen.getByRole('dialog', { name: 'New review' })
		expect(
			within(dialog).getByRole('textbox', { name: 'Review description' }),
		).toHaveValue('Big draft')

		fireEvent.click(
			screen.getByRole('button', { name: 'Minimize review composer' }),
		)
		fireEvent.click(newReviewToggle())
		expect(
			screen.getByRole('dialog', { name: 'New review' }),
		).toBeInTheDocument()
	})

	it('carries a minimized dialog to and from the caller', () => {
		const onDockChange = vi.fn()
		render(
			<TooltipProvider delay={0}>
				<CardDetail
					cardId={firstCard}
					activeTab='overview'
					onTabChange={() => {}}
					defaultDock={{ state: 'minimized', isExpanded: true }}
					onDockChange={onDockChange}
				/>
			</TooltipProvider>,
		)
		expect(
			screen.queryByRole('dialog', { name: 'New review' }),
		).not.toBeInTheDocument()

		fireEvent.click(newReviewToggle())
		expect(
			screen.getByRole('dialog', { name: 'New review' }),
		).toBeInTheDocument()
		expect(onDockChange).toHaveBeenLastCalledWith({
			state: 'open',
			isExpanded: true,
		})

		fireEvent.click(
			screen.getByRole('button', { name: 'Minimize review composer' }),
		)
		expect(onDockChange).toHaveBeenLastCalledWith({
			state: 'minimized',
			isExpanded: true,
		})
	})

	it('collapses the dialog to the dock on Escape', () => {
		render(detail('overview'))
		openDock()
		fireEvent.change(description(), { target: { value: 'Stay docked' } })
		fireEvent.click(
			screen.getByRole('button', { name: 'Expand review composer' }),
		)

		fireEvent.keyDown(screen.getByRole('dialog', { name: 'New review' }), {
			key: 'Escape',
		})
		expect(
			screen.queryByRole('dialog', { name: 'New review' }),
		).not.toBeInTheDocument()
		expect(queryDock()).toBeInTheDocument()
		expect(description()).toHaveValue('Stay docked')
	})

	it('opens docked again after closing the dialog', () => {
		render(detail('overview'))
		openDock()
		fireEvent.click(
			screen.getByRole('button', { name: 'Expand review composer' }),
		)
		closeDock()
		expect(
			screen.queryByRole('dialog', { name: 'New review' }),
		).not.toBeInTheDocument()

		openDock()
		expect(
			screen.queryByRole('dialog', { name: 'New review' }),
		).not.toBeInTheDocument()
	})

	it('closes an empty composer without asking', () => {
		render(detail('overview'))
		openDock()
		closeDock()

		expect(queryDock()).not.toBeInTheDocument()
		expect(
			screen.queryByRole('dialog', { name: 'Discard review?' }),
		).not.toBeInTheDocument()
	})

	it('asks before discarding a draft on close', () => {
		render(detail('overview'))
		openDock()
		fireEvent.change(description(), { target: { value: 'Maybe keep' } })

		closeDock()
		const prompt = screen.getByRole('dialog', { name: 'Discard review?' })
		fireEvent.click(within(prompt).getByRole('button', { name: 'Cancel' }))
		expect(description()).toHaveValue('Maybe keep')

		closeDock()
		fireEvent.click(
			within(
				screen.getByRole('dialog', { name: 'Discard review?' }),
			).getByRole('button', { name: 'Discard' }),
		)
		expect(queryDock()).not.toBeInTheDocument()
		openDock()
		expect(description()).toHaveValue('')
	})

	it('moves the draft between the dock and the expanded dialog', () => {
		render(detail('overview'))
		openDock()
		fireEvent.change(description(), { target: { value: 'Grow me' } })

		fireEvent.click(
			screen.getByRole('button', { name: 'Expand review composer' }),
		)
		const dialog = screen.getByRole('dialog', { name: 'New review' })
		expect(
			within(dialog).getByRole('textbox', { name: 'Review description' }),
		).toHaveValue('Grow me')

		fireEvent.click(
			within(dialog).getByRole('button', {
				name: 'Collapse review composer',
			}),
		)
		expect(
			screen.queryByRole('dialog', { name: 'New review' }),
		).not.toBeInTheDocument()
		expect(description()).toHaveValue('Grow me')
	})

	it('asks before discarding from the expanded dialog', () => {
		render(detail('overview'))
		openDock()
		fireEvent.change(description(), { target: { value: 'Expanded draft' } })
		fireEvent.click(
			screen.getByRole('button', { name: 'Expand review composer' }),
		)

		closeDock()
		fireEvent.click(
			within(
				screen.getByRole('dialog', { name: 'Discard review?' }),
			).getByRole('button', { name: 'Discard' }),
		)
		expect(
			screen.queryByRole('dialog', { name: 'New review' }),
		).not.toBeInTheDocument()
		expect(queryDock()).not.toBeInTheDocument()
	})

	it('closes the dock after a successful create', () => {
		render(detail('overview'))
		openDock()
		fireEvent.change(description(), { target: { value: 'Submit me' } })
		fireEvent.click(submitButton())

		const callbacks = mutation.mutate.mock.calls[0]?.[1]
		act(() => callbacks.onSuccess())
		expect(queryDock()).not.toBeInTheDocument()
		openDock()
		expect(description()).toHaveValue('')
	})

	it('keeps the dock and its draft across tabs', () => {
		const view = render(detail('overview'))
		openDock()
		fireEvent.change(description(), {
			target: { value: 'Started on Overview' },
		})
		fireEvent.change(notes(), { target: { value: 'Shared notes' } })

		view.rerender(detail('reviews'))
		expect(description()).toHaveValue('Started on Overview')
		expect(notes()).toHaveValue('Shared notes')
	})

	it('discards content when changing cards or leaving CardDetail', () => {
		const view = render(detail('overview'))
		openDock()
		fireEvent.change(description(), {
			target: { value: 'First card only' },
		})
		view.rerender(detail('overview', secondCard))
		expect(queryDock()).not.toBeInTheDocument()
		openDock()
		expect(description()).toHaveValue('')
		fireEvent.change(description(), {
			target: { value: 'Discard on leave' },
		})
		view.unmount()
		render(detail('overview'))
		openDock()
		expect(description()).toHaveValue('')
	})

	it('keeps submission pending across tabs and closes on success', () => {
		const view = render(detail('overview'))
		openDock()
		fireEvent.change(description(), {
			target: { value: 'Submit across tabs' },
		})
		fireEvent.click(submitButton())
		const callbacks = mutation.mutate.mock.calls[0]?.[1]
		mutation.isPending = true
		view.rerender(detail('reviews'))
		expect(description()).toBeDisabled()
		expect(submitButton()).toBeDisabled()
		expect(description()).toHaveValue('Submit across tabs')
		mutation.isPending = false
		act(() => callbacks.onSuccess())
		expect(queryDock()).not.toBeInTheDocument()
		openDock()
		expect(description()).toHaveValue('')
	})

	it('retains content after a failed submission', () => {
		render(detail('reviews'))
		openDock()
		fireEvent.change(description(), {
			target: { value: 'Keep on failure' },
		})
		fireEvent.click(submitButton())
		const callbacks = mutation.mutate.mock.calls[0]?.[1]
		act(() => callbacks.onError())
		expect(description()).toHaveValue('Keep on failure')
	})

	it('submits rating and date, including a rating-only review', () => {
		render(detail('overview'))
		openDock()
		fireEvent.click(screen.getByRole('button', { name: 'Rating none' }))
		fireEvent.click(screen.getByRole('button', { name: /^Date / }))
		expect(
			screen.getByRole('button', { name: 'Rating 3' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Date 2026-09-01' }),
		).toBeInTheDocument()
		fireEvent.click(submitButton())
		expect(mutation.mutate).toHaveBeenCalledWith(
			{
				cardId: firstCard,
				description: '',
				notes: '',
				rating: 3,
				date: '2026-09-01',
			},
			expect.any(Object),
		)
	})
})
