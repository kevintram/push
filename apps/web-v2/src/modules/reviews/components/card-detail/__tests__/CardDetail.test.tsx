import type { Id } from '@convex/_generated/dataModel'
import { act, fireEvent, render, screen } from '@testing-library/react'
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
	it('shares content in both directions and restores the open sidebar', () => {
		const view = render(detail('overview'))
		fireEvent.click(screen.getByRole('button', { name: 'Add review' }))
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
		expect(
			screen.getByRole('button', { name: 'Add review' }),
		).toHaveAttribute('aria-expanded', 'true')
	})

	it('opens the sidebar for content first entered on Reviews', () => {
		const view = render(detail('reviews'))
		fireEvent.change(notes(), { target: { value: 'Reviews-first notes' } })
		view.rerender(detail('overview'))
		expect(notes()).toHaveValue('Reviews-first notes')
	})

	it('preserves an explicitly opened empty composer across tabs', () => {
		const view = render(detail('overview'))
		fireEvent.click(screen.getByRole('button', { name: 'Add review' }))
		view.rerender(detail('reviews'))
		view.rerender(detail('overview'))
		expect(description()).toHaveValue('')
	})

	it('clears both placements on Cancel', () => {
		const view = render(detail('overview'))
		fireEvent.click(screen.getByRole('button', { name: 'Add review' }))
		fireEvent.change(description(), { target: { value: 'To cancel' } })
		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
		expect(
			screen.queryByRole('form', { name: 'Add review' }),
		).not.toBeInTheDocument()
		view.rerender(detail('reviews'))
		expect(description()).toHaveValue('')
	})

	it('closes the sidebar when cancelling from Reviews', () => {
		const view = render(detail('overview'))
		fireEvent.click(screen.getByRole('button', { name: 'Add review' }))
		fireEvent.change(description(), {
			target: { value: 'Cancel from Reviews' },
		})
		view.rerender(detail('reviews'))
		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
		expect(description()).toHaveValue('')
		view.rerender(detail('overview'))
		expect(
			screen.queryByRole('form', { name: 'Add review' }),
		).not.toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Add review' }),
		).toHaveAttribute('aria-expanded', 'false')
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
		fireEvent.click(screen.getByRole('button', { name: 'Add review' }))
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
		expect(
			screen.queryByRole('form', { name: 'Add review' }),
		).not.toBeInTheDocument()
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
