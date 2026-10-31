import type { Id } from '@convex/_generated/dataModel'
import { QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConvexError } from 'convex/values'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest'

import { TooltipProvider } from '~/components/ui'
import { toast } from '~/components/ui/Toast'
import { createTestQueryClient } from '~/testing/createTestQueryClient'
import { toastTitleText } from '~/testing/toastTitleText'

import { ReviewComposer } from '../ReviewComposer'
import { ReviewComposerProvider } from '../ReviewComposerProvider'

const { createReview } = vi.hoisted(() => ({ createReview: vi.fn() }))

// How the server answers a rated review, which the toast describes.
const created = {
	review: {
		_id: 'review-1',
		rating: 'good',
		stabilityBefore: 3,
		stabilityAfter: 9,
	},
	card: { primaryText: 'Gracias', dueDate: '2026-11-08' },
}

vi.mock('@convex-dev/react-query', () => ({
	convexQuery: vi.fn(),
	useConvexMutation: () => createReview,
}))

vi.mock('../RatingButtons', () => ({
	RatingButtons: () => <button type='button'>Rating</button>,
}))

vi.mock('../ReviewDatePicker', () => ({
	ReviewDatePicker: () => <button type='button'>Date</button>,
}))

const cardId = 'card-1' as Id<'cards'>

function renderComposer(
	props: Partial<ComponentProps<typeof ReviewComposer>> = {},
	providerProps: Partial<ComponentProps<typeof ReviewComposerProvider>> = {},
) {
	return render(
		<QueryClientProvider client={createTestQueryClient()}>
			<TooltipProvider delay={0}>
				<ReviewComposerProvider cardId={cardId} {...providerProps}>
					<ReviewComposer {...props} />
				</ReviewComposerProvider>
			</TooltipProvider>
		</QueryClientProvider>,
	)
}

describe('ReviewComposer', () => {
	beforeEach(() => {
		createReview.mockReset()
		createReview.mockResolvedValue(created)
	})

	it.each(['Review description', 'Review notes'])(
		'submits with Mod+Enter from the %s field',
		async fieldName => {
			renderComposer()

			const field = screen.getByRole('textbox', { name: fieldName })
			fireEvent.change(field, { target: { value: 'A review' } })
			fireEvent.keyDown(field, { key: 'Enter', ctrlKey: true })

			await waitFor(() =>
				expect(createReview.mock.calls[0]?.[0]).toEqual({
					cardId,
					description:
						fieldName === 'Review description' ? 'A review' : '',
					notes: fieldName === 'Review notes' ? 'A review' : '',
				}),
			)
		},
	)

	it('does not submit an empty draft with Mod+Enter', () => {
		renderComposer()

		const description = screen.getByRole('textbox', {
			name: 'Review description',
		})
		fireEvent.keyDown(description, { key: 'Enter', ctrlKey: true })

		expect(createReview).not.toHaveBeenCalled()
	})

	it('shows its shortcut inside the Create button', () => {
		renderComposer()

		const create = screen.getByRole('button', { name: 'Create review' })
		expect(create.querySelector('kbd')).toHaveTextContent('↵')
		expect(create).toHaveAttribute('aria-keyshortcuts')
	})

	it('clears the draft after a successful create', async () => {
		const user = userEvent.setup()
		renderComposer()

		const description = screen.getByRole('textbox', {
			name: 'Review description',
		})
		fireEvent.change(description, { target: { value: 'A review' } })
		await user.click(screen.getByRole('button', { name: 'Create review' }))

		await waitFor(() => expect(description).toHaveValue(''))
	})

	it('names the rating and card in the toast', async () => {
		const user = userEvent.setup()
		const addToast = vi.spyOn(toast, 'add')
		renderComposer()

		fireEvent.change(
			screen.getByRole('textbox', { name: 'Review description' }),
			{ target: { value: 'A review' } },
		)
		await user.click(screen.getByRole('button', { name: 'Create review' }))

		await waitFor(() => expect(addToast).toHaveBeenCalled())
		const [{ title }] = addToast.mock.lastCall!
		expect(toastTitleText(title)).toBe('Good on **Gracias**')
	})

	it('skips the toast for a review with neither a rating nor a date', async () => {
		const user = userEvent.setup()
		const addToast = vi.spyOn(toast, 'add')
		createReview.mockResolvedValue({
			review: { _id: 'review-1' },
			card: { primaryText: 'Gracias' },
		})
		renderComposer()

		const description = screen.getByRole('textbox', {
			name: 'Review description',
		})
		fireEvent.change(description, { target: { value: 'A note' } })
		await user.click(screen.getByRole('button', { name: 'Create review' }))

		await waitFor(() => expect(description).toHaveValue(''))
		expect(addToast).not.toHaveBeenCalled()
	})

	it('preserves the draft when creation fails', async () => {
		const user = userEvent.setup()
		const addToast = vi.spyOn(toast, 'add')
		createReview.mockRejectedValue(new ConvexError('Card not found'))
		renderComposer()

		const description = screen.getByRole('textbox', {
			name: 'Review description',
		})
		fireEvent.change(description, { target: { value: 'Keep this draft' } })
		await user.click(screen.getByRole('button', { name: 'Create review' }))

		await waitFor(() =>
			expect(addToast).toHaveBeenCalledWith({
				description: 'Card not found',
				title: 'Failed to create review',
				type: 'error',
			}),
		)
		expect(description).toHaveValue('Keep this draft')
	})

	it('brings the draft back when the review is undone', async () => {
		const user = userEvent.setup()
		const addToast = vi.spyOn(toast, 'add')
		renderComposer()

		const description = screen.getByRole('textbox', {
			name: 'Review description',
		})
		fireEvent.change(description, { target: { value: 'Undo me' } })
		await user.click(screen.getByRole('button', { name: 'Create review' }))
		await waitFor(() => expect(description).toHaveValue(''))
		await undoLastToast(addToast)

		await waitFor(() =>
			expect(
				screen.getByRole('textbox', { name: 'Review description' }),
			).toHaveValue('Undo me'),
		)
		expect(createReview).toHaveBeenLastCalledWith({ reviewId: 'review-1' })
	})

	it('hands the draft to the parent when the review is undone after unmounting', async () => {
		const user = userEvent.setup()
		const addToast = vi.spyOn(toast, 'add')
		const onReviewUndone = vi.fn()
		const { unmount } = renderComposer({}, { onReviewUndone })

		fireEvent.change(
			screen.getByRole('textbox', { name: 'Review description' }),
			{ target: { value: 'Undo me' } },
		)
		await user.click(screen.getByRole('button', { name: 'Create review' }))
		await waitFor(() => expect(addToast).toHaveBeenCalled())
		unmount()
		await undoLastToast(addToast)

		await waitFor(() =>
			expect(onReviewUndone).toHaveBeenCalledWith({
				description: 'Undo me',
				notes: '',
				rating: null,
				date: null,
			}),
		)
	})
})

/** Clicks Undo on the most recent toast. */
async function undoLastToast(addToast: MockInstance<typeof toast.add>) {
	const [{ actionProps }] = addToast.mock.lastCall!
	await act(async () => actionProps?.onClick?.({} as never))
}
