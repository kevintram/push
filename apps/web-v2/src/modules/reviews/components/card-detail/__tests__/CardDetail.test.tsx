import type { Id } from '@convex/_generated/dataModel'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
	}: {
		rating?: number
		onSetRating: (value: number) => void
	}) => (
		<button type='button' onClick={() => onSetRating(3)}>
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

function notes() {
	return screen.getByRole('textbox', { name: 'Review notes' })
}

function fallbackForm() {
	const forms = screen.getAllByRole('form', { name: 'Add review' })
	const fallback = forms.at(-1)
	if (!fallback) throw new Error('Expected the fallback form to be open')
	return fallback
}

function fallbackDescription() {
	return within(fallbackForm()).getByRole('textbox', {
		name: 'Review description',
	})
}

function expectFallbackClosed() {
	expect(screen.queryAllByRole('form', { name: 'Add review' })).toHaveLength(
		0,
	)
}

describe('CardDetail review composer', () => {
	beforeEach(() => {
		mutation.mutate.mockReset()
		mutation.isPending = false
		cardActionsRender.mockReset()
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
		expect(
			screen.getByRole('button', { name: 'Show details' }),
		).toHaveAttribute('aria-expanded', 'false')
		expect(
			screen.queryByRole('complementary', { name: 'Card details' }),
		).not.toBeInTheDocument()

		fireEvent.click(screen.getByRole('button', { name: 'Show details' }))
		expect(
			screen.getByRole('complementary', { name: 'Card details' }),
		).toBeInTheDocument()
	})

	it('hands the shared draft to the fallback popover when the sidebar closes', () => {
		const view = render(detail('overview'))
		fireEvent.change(description(), {
			target: { value: 'Keep this draft' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Hide details' }))

		const fallbackTrigger = screen.getByRole('button', {
			name: 'Add review',
		})
		fireEvent.click(fallbackTrigger)
		expect(fallbackDescription()).toHaveValue('Keep this draft')
		expect(fallbackDescription()).toHaveFocus()

		fireEvent.click(fallbackTrigger)
		expectFallbackClosed()

		fireEvent.click(screen.getByRole('button', { name: 'Show details' }))
		expect(description()).toHaveValue('Keep this draft')
		view.unmount()
	})

	it('preserves the shared draft when the fallback is dismissed', () => {
		render(detail('overview'))
		fireEvent.click(screen.getByRole('button', { name: 'Hide details' }))
		const fallbackTrigger = screen.getByRole('button', {
			name: 'Add review',
		})
		fireEvent.click(fallbackTrigger)
		fireEvent.change(fallbackDescription(), {
			target: { value: 'Keep on dismiss' },
		})

		fireEvent.keyDown(document, { key: 'Escape' })
		expectFallbackClosed()

		fireEvent.click(fallbackTrigger)
		expect(fallbackDescription()).toHaveValue('Keep on dismiss')
	})

	it('resets and closes the fallback popover on Cancel', () => {
		render(detail('overview'))
		fireEvent.click(screen.getByRole('button', { name: 'Hide details' }))
		const fallbackTrigger = screen.getByRole('button', {
			name: 'Add review',
		})
		fireEvent.click(fallbackTrigger)
		fireEvent.change(fallbackDescription(), {
			target: { value: 'Discard me' },
		})
		fireEvent.click(
			within(fallbackForm()).getByRole('button', { name: 'Cancel' }),
		)

		expectFallbackClosed()
		fireEvent.click(fallbackTrigger)
		expect(fallbackDescription()).toHaveValue('')
	})

	it('closes the fallback popover after successful submission', () => {
		render(detail('overview'))
		fireEvent.click(screen.getByRole('button', { name: 'Hide details' }))
		const fallbackTrigger = screen.getByRole('button', {
			name: 'Add review',
		})
		fireEvent.click(fallbackTrigger)
		fireEvent.change(fallbackDescription(), {
			target: { value: 'Submit me' },
		})
		fireEvent.click(
			within(fallbackForm()).getByRole('button', { name: 'Add' }),
		)

		const callbacks = mutation.mutate.mock.calls[0]?.[1]
		act(() => callbacks.onSuccess())
		expectFallbackClosed()
		fireEvent.click(fallbackTrigger)
		expect(fallbackDescription()).toHaveValue('')
	})

	it('does not render the fallback on Reviews', () => {
		render(detail('reviews'))

		expect(
			screen.queryByRole('button', { name: 'Add review' }),
		).not.toBeInTheDocument()
	})

	it('shares content in both directions', () => {
		const view = render(detail('overview'))
		fireEvent.change(description(), {
			target: { value: 'Started in sidebar' },
		})
		fireEvent.change(notes(), { target: { value: 'Shared notes' } })

		view.rerender(detail('reviews'))
		expect(description()).toHaveValue('Started in sidebar')
		expect(notes()).toHaveValue('Shared notes')
		fireEvent.change(description(), {
			target: { value: 'Updated in reviews' },
		})

		view.rerender(detail('overview'))
		expect(description()).toHaveValue('Updated in reviews')
		expect(notes()).toHaveValue('Shared notes')
	})

	it('offers Cancel only once the draft has content', () => {
		render(detail('overview'))
		expect(
			screen.queryByRole('button', { name: 'Cancel' }),
		).not.toBeInTheDocument()

		fireEvent.change(description(), { target: { value: 'A draft' } })
		expect(
			screen.getByRole('button', { name: 'Cancel' }),
		).toBeInTheDocument()
	})

	it('clears both placements on Cancel', () => {
		const view = render(detail('overview'))
		fireEvent.change(description(), { target: { value: 'To cancel' } })
		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
		expect(description()).toHaveValue('')
		view.rerender(detail('reviews'))
		expect(description()).toHaveValue('')
	})

	it('clears both placements when cancelling from Reviews', () => {
		const view = render(detail('overview'))
		fireEvent.change(description(), {
			target: { value: 'Cancel from Reviews' },
		})
		view.rerender(detail('reviews'))
		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
		expect(description()).toHaveValue('')
		view.rerender(detail('overview'))
		expect(description()).toHaveValue('')
	})

	it('discards content when changing cards or leaving CardDetail', () => {
		const view = render(detail('reviews'))
		fireEvent.change(description(), {
			target: { value: 'First card only' },
		})
		view.rerender(detail('reviews', secondCard))
		expect(description()).toHaveValue('')
		fireEvent.change(description(), {
			target: { value: 'Second card only' },
		})
		view.rerender(detail('reviews'))
		expect(description()).toHaveValue('')
		fireEvent.change(description(), {
			target: { value: 'Discard on leave' },
		})
		view.unmount()
		render(detail('reviews'))
		expect(description()).toHaveValue('')
	})
	it('keeps submission pending across tabs and clears on success after switching', () => {
		const view = render(detail('overview'))
		fireEvent.change(description(), {
			target: { value: 'Submit across tabs' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Add' }))
		const callbacks = mutation.mutate.mock.calls[0]?.[1]
		mutation.isPending = true
		view.rerender(detail('reviews'))
		expect(description()).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
		expect(description()).toHaveValue('Submit across tabs')
		mutation.isPending = false
		act(() => callbacks.onSuccess())
		expect(description()).toHaveValue('')
		view.rerender(detail('overview'))
		expect(description()).toHaveValue('')
	})

	it('retains content after a failed submission on another tab', () => {
		const view = render(detail('reviews'))
		fireEvent.change(description(), {
			target: { value: 'Keep on failure' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Add' }))
		const callbacks = mutation.mutate.mock.calls[0]?.[1]
		view.rerender(detail('overview'))
		act(() => callbacks.onError())
		expect(description()).toHaveValue('Keep on failure')
	})
	it('shares rating and date, including a rating-only review', () => {
		const view = render(detail('reviews'))
		fireEvent.click(screen.getByRole('button', { name: 'Rating none' }))
		view.rerender(detail('overview'))
		expect(
			screen.getByRole('button', { name: 'Rating 3' }),
		).toBeInTheDocument()
		fireEvent.click(screen.getByRole('button', { name: /^Date / }))
		view.rerender(detail('reviews'))
		expect(
			screen.getByRole('button', { name: 'Rating 3' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Date 2026-09-01' }),
		).toBeInTheDocument()
		fireEvent.click(screen.getByRole('button', { name: 'Add' }))
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
