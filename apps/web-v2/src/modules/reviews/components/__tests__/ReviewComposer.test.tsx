import type { Id } from '@convex/_generated/dataModel'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '~/components/ui'

import { ReviewComposer } from '../ReviewComposer'
import { ReviewComposerProvider } from '../ReviewComposerProvider'

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }))

vi.mock('../../api/reviewQueries', () => ({
	useCreateReview: () => ({ isPending: false, mutate }),
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
		<TooltipProvider delay={0}>
			<ReviewComposerProvider cardId={cardId}>
				<ReviewComposer {...props} />
			</ReviewComposerProvider>
		</TooltipProvider>,
	)
}

describe('ReviewComposer', () => {
	beforeEach(() => {
		mutate.mockReset()
	})

	it.each(['Review description', 'Review notes'])(
		'submits with Mod+Enter from the %s field',
		fieldName => {
			renderComposer()

			const field = screen.getByRole('textbox', { name: fieldName })
			fireEvent.change(field, { target: { value: 'A review' } })
			fireEvent.keyDown(field, { key: 'Enter', ctrlKey: true })

			expect(mutate).toHaveBeenCalledWith(
				{
					cardId,
					description:
						fieldName === 'Review description' ? 'A review' : '',
					notes: fieldName === 'Review notes' ? 'A review' : '',
				},
				expect.objectContaining({
					onError: expect.any(Function),
					onSuccess: expect.any(Function),
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

		expect(mutate).not.toHaveBeenCalled()
	})

	it('displays the Add review shortcut in the Add button tooltip', async () => {
		const user = userEvent.setup()
		renderComposer()

		fireEvent.change(
			screen.getByRole('textbox', { name: 'Review description' }),
			{ target: { value: 'A review' } },
		)
		await user.hover(screen.getByRole('button', { name: 'Add' }))

		const tooltip = await screen.findByRole('tooltip')
		expect(tooltip).toHaveTextContent('Add review')
		expect(tooltip.querySelector('kbd')).toHaveTextContent('↵')
	})

	it('focuses the description when autofocus is requested', () => {
		renderComposer({ autoFocusDescription: true })

		expect(
			screen.getByRole('textbox', { name: 'Review description' }),
		).toHaveFocus()
	})

	it('shows Cancel and resets the draft when a cancel callback is provided', async () => {
		const user = userEvent.setup()
		const onCancel = vi.fn()
		renderComposer({ onCancel })

		const description = screen.getByRole('textbox', {
			name: 'Review description',
		})
		fireEvent.change(description, { target: { value: 'Draft review' } })
		await user.click(screen.getByRole('button', { name: 'Cancel' }))

		expect(onCancel).toHaveBeenCalledOnce()
		expect(description).toHaveValue('')
	})

	it('notifies the parent only after a successful create', async () => {
		const user = userEvent.setup()
		const onSuccess = vi.fn()
		mutate.mockImplementation((_args, options) => options.onSuccess())
		renderComposer({ onSuccess })

		fireEvent.change(
			screen.getByRole('textbox', { name: 'Review description' }),
			{ target: { value: 'A review' } },
		)
		await user.click(screen.getByRole('button', { name: 'Add' }))

		expect(onSuccess).toHaveBeenCalledOnce()
	})

	it('preserves the draft and does not notify the parent when creation fails', async () => {
		const user = userEvent.setup()
		const onSuccess = vi.fn()
		mutate.mockImplementation((_args, options) => options.onError())
		renderComposer({ onSuccess })

		const description = screen.getByRole('textbox', {
			name: 'Review description',
		})
		fireEvent.change(description, { target: { value: 'Keep this draft' } })
		await user.click(screen.getByRole('button', { name: 'Add' }))

		expect(onSuccess).not.toHaveBeenCalled()
		expect(description).toHaveValue('Keep this draft')
	})
})
