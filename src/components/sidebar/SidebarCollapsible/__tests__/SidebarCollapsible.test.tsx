import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import {
	SidebarCollapsibleActions,
	SidebarCollapsibleContent,
	SidebarCollapsibleHeader,
	SidebarCollapsibleItem,
	SidebarCollapsibleTrigger,
} from '..'

describe('SidebarCollapsible', () => {
	it('starts open by default and preserves expanded state and panel association', async () => {
		const user = userEvent.setup()
		render(
			<SidebarCollapsibleItem defaultOpen aria-label='Review'>
				<SidebarCollapsibleHeader>
					<SidebarCollapsibleTrigger>
						Review
					</SidebarCollapsibleTrigger>
				</SidebarCollapsibleHeader>
				<SidebarCollapsibleContent
					render={<nav aria-label='Review sections' />}
				>
					<a href='/review/due'>Due</a>
				</SidebarCollapsibleContent>
			</SidebarCollapsibleItem>,
		)

		const trigger = screen.getByRole('button', { name: 'Collapse Review' })
		const panel = screen.getByRole('navigation', {
			name: 'Review sections',
		})
		expect(trigger).toHaveAttribute('aria-expanded', 'true')
		expect(trigger).toHaveAttribute('aria-controls', panel.id)

		await user.click(trigger)
		expect(
			screen.getByRole('button', { name: 'Expand Review' }),
		).toHaveAttribute('aria-expanded', 'false')
		expect(
			screen.queryByRole('navigation', { name: 'Review sections' }),
		).not.toBeInTheDocument()
	})

	it('supports controlled open state', async () => {
		const user = userEvent.setup()
		const onOpenChange = vi.fn()
		function ControlledItem() {
			const [open, setOpen] = useState(false)
			return (
				<SidebarCollapsibleItem
					open={open}
					onOpenChange={(nextOpen, eventDetails) => {
						onOpenChange(nextOpen, eventDetails)
						setOpen(nextOpen)
					}}
				>
					<SidebarCollapsibleHeader>
						<SidebarCollapsibleTrigger>
							Library
						</SidebarCollapsibleTrigger>
					</SidebarCollapsibleHeader>
					<SidebarCollapsibleContent>
						<p>Collection tree</p>
					</SidebarCollapsibleContent>
				</SidebarCollapsibleItem>
			)
		}
		render(<ControlledItem />)

		await user.click(screen.getByRole('button', { name: 'Expand Library' }))
		expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything())
		expect(
			screen.getByRole('button', { name: 'Collapse Library' }),
		).toHaveAttribute('aria-expanded', 'true')
	})

	it.each(['Enter', ' '])('toggles with %s', async key => {
		const user = userEvent.setup()
		render(
			<SidebarCollapsibleItem defaultOpen>
				<SidebarCollapsibleHeader>
					<SidebarCollapsibleTrigger>
						Review
					</SidebarCollapsibleTrigger>
				</SidebarCollapsibleHeader>
				<SidebarCollapsibleContent>Links</SidebarCollapsibleContent>
			</SidebarCollapsibleItem>,
		)

		const trigger = screen.getByRole('button', { name: 'Collapse Review' })
		trigger.focus()
		await user.keyboard(key === 'Enter' ? '{Enter}' : ' ')
		expect(
			screen.getByRole('button', { name: 'Expand Review' }),
		).toHaveAttribute('aria-expanded', 'false')
	})

	it('keeps action buttons independent and forwards the header ref', async () => {
		const user = userEvent.setup()
		const headerRef = vi.fn()
		const onAction = vi.fn()
		render(
			<SidebarCollapsibleItem defaultOpen>
				<SidebarCollapsibleHeader ref={headerRef}>
					<SidebarCollapsibleTrigger>
						Library
					</SidebarCollapsibleTrigger>
					<SidebarCollapsibleActions>
						<button type='button' onClick={onAction}>
							Add collection
						</button>
					</SidebarCollapsibleActions>
				</SidebarCollapsibleHeader>
				<SidebarCollapsibleContent>
					Collection tree
				</SidebarCollapsibleContent>
			</SidebarCollapsibleItem>,
		)

		const header = screen.getByRole('button', {
			name: 'Collapse Library',
		}).parentElement
		expect(headerRef).toHaveBeenCalledWith(header)
		await user.click(screen.getByRole('button', { name: 'Add collection' }))
		expect(onAction).toHaveBeenCalledOnce()
		expect(
			screen.getByRole('button', { name: 'Collapse Library' }),
		).toHaveAttribute('aria-expanded', 'true')
	})
})
