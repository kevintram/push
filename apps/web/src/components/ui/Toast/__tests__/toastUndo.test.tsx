import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConvexError } from 'convex/values'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { toast, Toaster, toastUndo } from '..'

afterEach(() => {
	act(() => toast.close())
})

describe('toastUndo', () => {
	it('runs the undo once and closes the toast', async () => {
		const undo = vi.fn().mockResolvedValue(undefined)
		render(<Toaster />)
		act(() => toastUndo('Moved card', undo))

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: 'Undo' }))

		expect(undo).toHaveBeenCalledOnce()
		await waitFor(() =>
			expect(screen.queryByText('Moved card')).not.toBeInTheDocument(),
		)
	})

	it('shows an error toast when the undo fails', async () => {
		render(<Toaster />)
		act(() =>
			toastUndo('Moved card', () =>
				Promise.reject(new ConvexError('Section not found')),
			),
		)

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: 'Undo' }))

		expect(await screen.findByText('Failed to undo')).toBeInTheDocument()
		expect(screen.getByText('Section not found')).toBeInTheDocument()
	})

	it('reaches Undo before the close button from the keyboard', async () => {
		const user = userEvent.setup()
		render(<Toaster />)
		act(() => toastUndo('Moved card', () => Promise.resolve()))

		await user.keyboard('{F6}')
		await user.tab()
		await user.tab()

		expect(screen.getByRole('button', { name: 'Undo' })).toHaveFocus()
	})

	it('takes the Undo button off the previous undo toast, but keeps it', async () => {
		const first = vi.fn().mockResolvedValue(undefined)
		const second = vi.fn().mockResolvedValue(undefined)
		render(<Toaster />)
		act(() => {
			toastUndo('Moved collection', first)
			toastUndo('Retired card', second)
		})

		expect(screen.getByText('Moved collection')).toBeInTheDocument()
		const undoButtons = screen.getAllByRole('button', { name: 'Undo' })
		expect(undoButtons).toHaveLength(1)
		await userEvent.setup().click(undoButtons[0]!)

		expect(second).toHaveBeenCalledOnce()
		expect(first).not.toHaveBeenCalled()
	})
})
