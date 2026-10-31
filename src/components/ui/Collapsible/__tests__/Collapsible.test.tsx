import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '..'

describe('Collapsible', () => {
	it('toggles a panel while keeping its contents mounted', async () => {
		const user = userEvent.setup()

		render(
			<Collapsible defaultOpen>
				<CollapsibleTrigger>Toggle details</CollapsibleTrigger>
				<CollapsibleContent keepMounted>
					<p>Panel details</p>
				</CollapsibleContent>
			</Collapsible>,
		)

		const trigger = screen.getByRole('button', { name: 'Toggle details' })
		const content = screen.getByText('Panel details').parentElement

		expect(trigger).toHaveAttribute('aria-expanded', 'true')
		expect(content).not.toHaveAttribute('hidden')

		await user.click(trigger)

		expect(trigger).toHaveAttribute('aria-expanded', 'false')
		expect(content).toHaveAttribute('hidden')
		expect(screen.getByText('Panel details')).toBeInTheDocument()
	})

	it('supports custom semantic elements through render props', () => {
		const { container } = render(
			<Collapsible render={<li />}>
				<CollapsibleTrigger>Toggle children</CollapsibleTrigger>
				<CollapsibleContent keepMounted render={<ul />}>
					<li>Child</li>
				</CollapsibleContent>
			</Collapsible>,
		)

		expect(container.firstElementChild?.tagName).toBe('LI')
		expect(container.querySelector('ul')).toHaveAttribute(
			'data-slot',
			'collapsible-content',
		)
	})
})
