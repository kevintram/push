import type { Id } from '@convex/_generated/dataModel'
import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConvexError } from 'convex/values'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '~/components/ui'
import { toast } from '~/components/ui/Toast'
import { createTestQueryClient } from '~/testing/createTestQueryClient'

import { ReviewComposer } from '../ReviewComposer'
import { ReviewComposerProvider } from '../ReviewComposerProvider'

const { createReview } = vi.hoisted(() => ({ createReview: vi.fn() }))

vi.mock('@convex-dev/react-query', () => ({
	convexQuery: vi.fn(),
	useConvexMutation: () => createReview,
}))

vi.mock('../RatingPicker', () => ({
	RatingPicker: () => <button type='button'>Rating</button>,
}))

vi.mock('../ReviewDatePicker', () => ({
	ReviewDatePicker: () => <button type='button'>Date</button>,
}))

const cardId = 'card-1' as Id<'cards'>

function renderComposer(
	props: Partial<ComponentProps<typeof ReviewComposer>> = {},
) {
	return render(
		<QueryClientProvider client={createTestQueryClient()}>
			<TooltipProvider delay={0}>
				<ReviewComposerProvider cardId={cardId}>
					<ReviewComposer {...props} />
				</ReviewComposerProvider>
			</TooltipProvider>
		</QueryClientProvider>,
	)
}

describe('ReviewComposer', () => {
	beforeEach(() => {
		createReview.mockReset()
		createReview.mockResolvedValue('review-1')
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

	it('displays the shortcut in the Create button tooltip', async () => {
		const user = userEvent.setup()
		renderComposer()

		fireEvent.change(
			screen.getByRole('textbox', { name: 'Review description' }),
			{ target: { value: 'A review' } },
		)
		await user.hover(screen.getByRole('button', { name: 'Create review' }))

		const tooltip = await screen.findByRole('tooltip')
		expect(tooltip).toHaveTextContent('Create review')
		expect(tooltip.querySelector('kbd')).toHaveTextContent('↵')
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
})
