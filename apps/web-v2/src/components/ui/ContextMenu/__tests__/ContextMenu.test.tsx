import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '..'

describe('ContextMenu', () => {
	it('opens on right click and selects an item', async () => {
		const user = userEvent.setup()
		const handleClick = vi.fn()

		render(
			<ContextMenu>
				<ContextMenuTrigger>Review card</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem onClick={handleClick}>
						Edit
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>,
		)

		expect(screen.queryByRole('menu')).not.toBeInTheDocument()
		fireEvent.contextMenu(screen.getByText('Review card'))
		await user.click(screen.getByRole('menuitem', { name: 'Edit' }))

		expect(handleClick).toHaveBeenCalledOnce()
		expect(screen.queryByRole('menu')).not.toBeInTheDocument()
	})

	it('supports keyboard navigation and disabled items', async () => {
		const user = userEvent.setup()
		const handleDisabledClick = vi.fn()

		render(
			<ContextMenu>
				<ContextMenuTrigger>Review card</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem disabled onClick={handleDisabledClick}>
						Unavailable
					</ContextMenuItem>
					<ContextMenuItem>Available</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>,
		)

		fireEvent.contextMenu(screen.getByText('Review card'))
		const disabledItem = screen.getByRole('menuitem', {
			name: 'Unavailable',
		})

		await waitFor(() => expect(screen.getByRole('menu')).toHaveFocus())
		await user.keyboard('{ArrowDown}')
		expect(disabledItem).toHaveFocus()
		await user.keyboard('{Enter}{ArrowDown}')

		expect(
			screen.getByRole('menuitem', { name: 'Available' }),
		).toHaveFocus()
		expect(handleDisabledClick).not.toHaveBeenCalled()
	})
})
