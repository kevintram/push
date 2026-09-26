import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Kbd, KbdGroup } from '..'

describe('Kbd', () => {
	it('renders textual keyboard input', () => {
		render(<Kbd>Ctrl</Kbd>)

		const key = screen.getByText('Ctrl')
		expect(key.tagName).toBe('KBD')
		expect(key).toHaveAttribute('data-slot', 'kbd')
	})

	it('groups multiple keyboard keys', () => {
		render(
			<KbdGroup data-testid='shortcut'>
				<Kbd>Ctrl</Kbd>
				<Kbd>B</Kbd>
			</KbdGroup>,
		)

		const group = screen.getByTestId('shortcut')
		expect(group.tagName).toBe('KBD')
		expect(group).toHaveAttribute('data-slot', 'kbd-group')
		expect(group.querySelectorAll('[data-slot="kbd"]')).toHaveLength(2)
	})
})
