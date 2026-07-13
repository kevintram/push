import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Button } from '../../Button'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '..'

function TestDialog({ showCloseButton = true }: { showCloseButton?: boolean }) {
	return (
		<Dialog>
			<DialogTrigger>Open dialog</DialogTrigger>
			<DialogContent showCloseButton={showCloseButton}>
				<DialogHeader>
					<DialogTitle>Edit review</DialogTitle>
					<DialogDescription>
						Update the review details.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose render={<Button variant='outline' />}>
						Cancel
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

describe('Dialog', () => {
	it('opens an accessibly named dialog and closes with the close button', async () => {
		const user = userEvent.setup()
		render(<TestDialog />)
		const trigger = screen.getByRole('button', { name: 'Open dialog' })

		await user.click(trigger)

		expect(
			screen.getByRole('dialog', { name: 'Edit review' }),
		).toHaveAccessibleDescription('Update the review details.')

		await user.click(screen.getByRole('button', { name: 'Close' }))

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
		expect(trigger).toHaveFocus()
	})

	it('closes with Escape', async () => {
		const user = userEvent.setup()
		render(<TestDialog />)

		await user.click(screen.getByRole('button', { name: 'Open dialog' }))
		await user.keyboard('{Escape}')

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
	})

	it('can hide the default close button', async () => {
		const user = userEvent.setup()
		render(<TestDialog showCloseButton={false} />)

		await user.click(screen.getByRole('button', { name: 'Open dialog' }))

		expect(
			screen.queryByRole('button', { name: 'Close' }),
		).not.toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Cancel' }),
		).toBeInTheDocument()
	})

	it('supports controlled state', async () => {
		const user = userEvent.setup()
		const onOpenChange = vi.fn()

		function ControlledDialog() {
			const [open, setOpen] = useState(false)

			return (
				<Dialog
					open={open}
					onOpenChange={(nextOpen, details) => {
						onOpenChange(nextOpen, details)
						setOpen(nextOpen)
					}}
				>
					<DialogTrigger>Open controlled dialog</DialogTrigger>
					<DialogContent>
						<DialogTitle>Controlled dialog</DialogTitle>
					</DialogContent>
				</Dialog>
			)
		}

		render(<ControlledDialog />)
		await user.click(
			screen.getByRole('button', { name: 'Open controlled dialog' }),
		)

		expect(onOpenChange).toHaveBeenCalledWith(true, expect.any(Object))
		expect(
			screen.getByRole('dialog', { name: 'Controlled dialog' }),
		).toBeInTheDocument()
	})
})
