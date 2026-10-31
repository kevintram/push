import { useHotkey } from '@tanstack/react-hotkeys'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Popover, PopoverContent, PopoverTrigger } from '..'

function PageHotkey({ onPress }: { onPress: () => void }) {
	useHotkey('J', onPress)
	return null
}

function renderPopover(onPress: () => void, openOnHover = false) {
	render(
		<>
			<PageHotkey onPress={onPress} />
			<Popover>
				<PopoverTrigger openOnHover={openOnHover} delay={0}>
					Open
				</PopoverTrigger>
				<PopoverContent>
					<button type='button'>Inside</button>
				</PopoverContent>
			</Popover>
		</>,
	)
}

describe('PopoverContent', () => {
	it('keeps page hotkeys from acting while focus is inside it', async () => {
		const user = userEvent.setup()
		const onPress = vi.fn()
		renderPopover(onPress)

		await user.click(screen.getByRole('button', { name: 'Open' }))
		const popup = await screen.findByRole('dialog')
		await waitFor(() =>
			expect(popup).toContainElement(
				document.activeElement as HTMLElement,
			),
		)

		await user.keyboard('j')
		expect(onPress).not.toHaveBeenCalled()
	})

	it('leaves page hotkeys alone while hovered open without focus', async () => {
		const user = userEvent.setup()
		const onPress = vi.fn()
		renderPopover(onPress, true)

		await user.hover(screen.getByRole('button', { name: 'Open' }))
		const popup = await screen.findByRole('dialog')
		expect(popup).not.toContainElement(
			document.activeElement as HTMLElement,
		)

		await user.keyboard('j')
		expect(onPress).toHaveBeenCalledOnce()
	})

	it('starts each opening without focus, even if it closed with focus inside', async () => {
		const user = userEvent.setup()
		const onPress = vi.fn()
		renderPopover(onPress, true)
		const trigger = screen.getByRole('button', { name: 'Open' })

		await user.hover(trigger)
		screen.getByRole('button', { name: 'Inside' }).focus()
		await user.unhover(trigger)
		await waitFor(() =>
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
		)

		await user.hover(trigger)
		await screen.findByRole('dialog')
		await user.keyboard('j')
		expect(onPress).toHaveBeenCalledOnce()
	})
})
