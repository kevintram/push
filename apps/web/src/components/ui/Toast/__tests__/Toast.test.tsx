import { Toast as ToastPrimitive } from '@base-ui/react/toast'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Toaster } from '..'

function renderToaster() {
	const toastManager = ToastPrimitive.createToastManager()
	render(<Toaster timeout={0} toastManager={toastManager} />)
	return toastManager
}

describe('Toaster', () => {
	it('renders the title, description, and close button', () => {
		const toastManager = renderToaster()

		act(() => {
			toastManager.add({
				description: 'The destination collection no longer exists.',
				title: 'Failed to move card',
				type: 'error',
			})
		})

		expect(screen.getByText('Failed to move card')).toBeInTheDocument()
		expect(
			screen.getByText('The destination collection no longer exists.'),
		).toBeInTheDocument()
		expect(screen.getByLabelText('Close toast')).toBeInTheDocument()
	})

	it('renders a description-only toast', () => {
		const toastManager = renderToaster()

		act(() => {
			toastManager.add({ description: 'Copied to clipboard' })
		})

		expect(screen.getByText('Copied to clipboard')).toBeInTheDocument()
	})

	it('renders actionProps and invokes its handler', async () => {
		const user = userEvent.setup()
		const onClick = vi.fn()
		const toastManager = renderToaster()

		act(() => {
			toastManager.add({
				actionProps: { children: 'Undo', onClick },
				title: 'Card deleted',
			})
		})

		await user.click(screen.getByRole('button', { name: 'Undo' }))

		expect(onClick).toHaveBeenCalledOnce()
	})
})
