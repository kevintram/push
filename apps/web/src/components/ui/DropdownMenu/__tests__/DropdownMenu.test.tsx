import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '..'

describe('DropdownMenu', () => {
	it('opens and selects an item', async () => {
		const user = userEvent.setup()
		const handleClick = vi.fn()

		render(
			<DropdownMenu>
				<DropdownMenuTrigger>Actions</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem onClick={handleClick}>
						Edit
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>,
		)

		expect(screen.queryByRole('menu')).not.toBeInTheDocument()
		await user.click(screen.getByRole('button', { name: 'Actions' }))
		await user.click(screen.getByRole('menuitem', { name: 'Edit' }))

		expect(handleClick).toHaveBeenCalledOnce()
		expect(screen.queryByRole('menu')).not.toBeInTheDocument()
	})

	it('supports keyboard navigation and disabled items', async () => {
		const user = userEvent.setup()
		const handleDisabledClick = vi.fn()

		render(
			<DropdownMenu>
				<DropdownMenuTrigger>Actions</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem disabled onClick={handleDisabledClick}>
						Unavailable
					</DropdownMenuItem>
					<DropdownMenuItem>Available</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>,
		)

		screen.getByRole('button').focus()
		await user.keyboard('{ArrowDown}')

		expect(
			screen.getByRole('menuitem', { name: 'Available' }),
		).toHaveFocus()
		expect(handleDisabledClick).not.toHaveBeenCalled()
	})

	it('toggles checkbox items', async () => {
		const user = userEvent.setup()
		const handleCheckedChange = vi.fn()

		render(
			<DropdownMenu>
				<DropdownMenuTrigger>View</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuCheckboxItem
						checked={false}
						onCheckedChange={handleCheckedChange}
					>
						Sidebar
					</DropdownMenuCheckboxItem>
				</DropdownMenuContent>
			</DropdownMenu>,
		)

		await user.click(screen.getByRole('button', { name: 'View' }))
		await user.click(
			screen.getByRole('menuitemcheckbox', { name: 'Sidebar' }),
		)

		expect(handleCheckedChange).toHaveBeenCalledWith(
			true,
			expect.anything(),
		)
	})

	it('renders item icon and suffix slots', async () => {
		const user = userEvent.setup()

		render(
			<DropdownMenu>
				<DropdownMenuTrigger>Actions</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem icon='⌘' suffix='→'>
						Open
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>,
		)

		await user.click(screen.getByRole('button', { name: 'Actions' }))

		const item = screen.getByRole('menuitem', {
			name: '⌘ Open →',
		})
		expect(item).toHaveTextContent('⌘')
		expect(item).toHaveTextContent('Open')
		expect(item).toHaveTextContent('→')
	})
})
