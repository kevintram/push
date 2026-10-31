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
		act(() => toastUndo({ title: 'Moved card', undo }))

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
			toastUndo({
				title: 'Moved card',
				undo: () =>
					Promise.reject(new ConvexError('Section not found')),
			}),
		)

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: 'Undo' }))

		expect(await screen.findByText('Failed to undo')).toBeInTheDocument()
		expect(screen.getByText('Section not found')).toBeInTheDocument()
	})

	it('reaches Undo, then Open, before the close button from the keyboard', async () => {
		const user = userEvent.setup()
		const open = vi.fn()
		render(<Toaster />)
		act(() =>
			toastUndo({
				title: 'Moved card',
				open: { label: 'Open', onClick: open },
				undo: () => Promise.resolve(),
			}),
		)

		await user.keyboard('{F6}')
		await user.tab()
		await user.tab()
		expect(screen.getByRole('button', { name: 'Undo' })).toHaveFocus()
		await user.tab()
		expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus()

		await user.click(screen.getByRole('button', { name: 'Open' }))
		expect(open).toHaveBeenCalledOnce()
		await waitFor(() =>
			expect(screen.queryByText('Moved card')).not.toBeInTheDocument(),
		)
	})

	it('takes the Undo button off the previous undo toast, but keeps it and Open', async () => {
		const first = vi.fn().mockResolvedValue(undefined)
		const second = vi.fn().mockResolvedValue(undefined)
		render(<Toaster />)
		act(() => {
			toastUndo({
				title: 'Moved collection',
				open: { label: 'Open', onClick: vi.fn() },
				undo: first,
			})
			toastUndo({ title: 'Retired card', undo: second })
		})

		expect(screen.getByText('Moved collection')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
		const undoButtons = screen.getAllByRole('button', { name: 'Undo' })
		expect(undoButtons).toHaveLength(1)
		await userEvent.setup().click(undoButtons[0]!)

		expect(second).toHaveBeenCalledOnce()
		expect(first).not.toHaveBeenCalled()
	})
})
