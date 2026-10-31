import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui'

import { appHotkeys } from '../appHotkeys'
import { hotkeyItemProps } from '../hotkeyItemProps'

async function renderItem(props: ReturnType<typeof hotkeyItemProps>) {
	render(
		<DropdownMenu>
			<DropdownMenuTrigger>Actions</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem {...props}>Go</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>,
	)
	await userEvent
		.setup()
		.click(screen.getByRole('button', { name: 'Actions' }))
	return screen.getByRole('menuitem', { name: 'Go' })
}

describe('hotkeyItemProps', () => {
	it('shows a chord’s keys and announces them, out of the item name', async () => {
		const item = await renderItem(hotkeyItemProps(appHotkeys.newReview))

		expect(item).toHaveAttribute('aria-keyshortcuts', 'C')
		expect(item.querySelector('kbd')).toHaveTextContent('C')
	})

	it('shows a sequence’s steps without announcing them', async () => {
		const item = await renderItem(hotkeyItemProps(appHotkeys.goToDue))

		expect(item).not.toHaveAttribute('aria-keyshortcuts')
		expect(item).toHaveTextContent(/G\s*then\s*D/)
	})
})
