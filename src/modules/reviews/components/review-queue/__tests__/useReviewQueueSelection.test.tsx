import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { Card } from '~/modules/reviews/types/review.types'

import { useReviewQueueSelection } from '../useReviewQueueSelection'

const card = (id: string) => ({ _id: id }) as Card

describe('useReviewQueueSelection', () => {
	it('selects an existing card by ID', () => {
		const { result } = renderHook(() =>
			useReviewQueueSelection([card('a'), card('b'), card('c')]),
		)

		act(() => result.current.selectCard('c' as Card['_id']))

		expect(result.current.currentCard?._id).toBe('c')
		expect(result.current.index).toBe(2)
	})

	it('does nothing when the ID is absent from the current cards', () => {
		const { result } = renderHook(() =>
			useReviewQueueSelection([card('a'), card('b'), card('c')]),
		)

		act(() => result.current.selectCard('missing' as Card['_id']))

		expect(result.current.currentCard?._id).toBe('a')
		expect(result.current.index).toBe(0)
	})

	it('keeps a card selected by identity after queue reordering', () => {
		const { result, rerender } = renderHook(
			({ cards }) => useReviewQueueSelection(cards),
			{ initialProps: { cards: [card('a'), card('b'), card('c')] } },
		)

		act(() => result.current.selectCard('c' as Card['_id']))
		expect(result.current.currentCard?._id).toBe('c')

		rerender({ cards: [card('x'), card('c'), card('a')] })

		expect(result.current.currentCard?._id).toBe('c')
		expect(result.current.index).toBe(1)
	})

	it('keeps the selected card when earlier queue items change', () => {
		const { result, rerender } = renderHook(
			({ cards }) => useReviewQueueSelection(cards),
			{ initialProps: { cards: [card('a'), card('b'), card('c')] } },
		)

		act(() => result.current.goNext())
		expect(result.current.currentCard?._id).toBe('b')

		rerender({ cards: [card('x'), card('a'), card('b'), card('c')] })
		expect(result.current.currentCard?._id).toBe('b')
		expect(result.current.index).toBe(2)
	})

	it('selects the replacement at the previous position when a card leaves', () => {
		const { result, rerender } = renderHook(
			({ cards }) => useReviewQueueSelection(cards),
			{ initialProps: { cards: [card('a'), card('b'), card('c')] } },
		)

		act(() => result.current.goNext())
		act(() => result.current.goNext())
		expect(result.current.currentCard?._id).toBe('c')

		rerender({ cards: [card('a'), card('b'), card('d')] })
		expect(result.current.currentCard?._id).toBe('d')
		expect(result.current.canGoNext).toBe(false)
	})

	it('does not wrap at either end', () => {
		const { result } = renderHook(() =>
			useReviewQueueSelection([card('a'), card('b')]),
		)

		act(() => result.current.goPrevious())
		expect(result.current.currentCard?._id).toBe('a')
		act(() => result.current.goNext())
		act(() => result.current.goNext())
		expect(result.current.currentCard?._id).toBe('b')
	})

	it('clamps the selection when a filter shrinks the queue past the selected index', () => {
		const { result, rerender } = renderHook(
			({ cards }) => useReviewQueueSelection(cards),
			{
				initialProps: {
					cards: [
						card('a'),
						card('b'),
						card('c'),
						card('d'),
						card('e'),
						card('f'),
					],
				},
			},
		)

		act(() => result.current.goNext())
		act(() => result.current.goNext())
		act(() => result.current.goNext())
		act(() => result.current.goNext())
		act(() => result.current.goNext())
		expect(result.current.currentCard?._id).toBe('f')
		expect(result.current.index).toBe(5)

		// Switching a filter can drop the selected card entirely and shrink
		// the queue well below the previous index.
		rerender({ cards: [card('a'), card('c')] })

		expect(result.current.index).toBe(1)
		expect(result.current.currentCard?._id).toBe('c')
		expect(result.current.canGoPrevious).toBe(true)
		expect(result.current.canGoNext).toBe(false)

		// Shrinking to nothing must not leave a stale out-of-range selection.
		rerender({ cards: [] })
		expect(result.current.currentCard).toBeNull()
		expect(result.current.index).toBe(-1)
		expect(result.current.canGoNext).toBe(false)
		expect(result.current.canGoPrevious).toBe(false)
	})

	it('returns to a card once it is back in the queue', () => {
		const { result, rerender } = renderHook(
			({ cards }) => useReviewQueueSelection(cards),
			{ initialProps: { cards: [card('b'), card('c')] } },
		)

		act(() => result.current.returnTo('a' as Card['_id']))
		expect(result.current.currentCard?._id).toBe('b')

		rerender({ cards: [card('a'), card('b'), card('c')] })

		expect(result.current.currentCard?._id).toBe('a')
	})
})
