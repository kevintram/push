import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Library } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'

import { AppRailItem } from '../AppRailItem'

describe('AppRailItem', () => {
	it('renders a button by default and reports clicks', async () => {
		const user = userEvent.setup()
		const onClick = vi.fn()
		render(<AppRailItem icon={Library} onClick={onClick} text='Library' />)

		const item = screen.getByRole('button', { name: 'Library' })
		expect(item).toHaveAttribute('type', 'button')

		await user.click(item)
		expect(onClick).toHaveBeenCalledOnce()
	})

	it('renders as the element passed through render', () => {
		render(
			<AppRailItem
				icon={Library}
				render={<a href='/library' />}
				text='Library'
			/>,
		)

		const item = screen.getByRole('link', { name: 'Library' })
		expect(item).toHaveAttribute('href', '/library')
		expect(item).not.toHaveAttribute('type')
	})

	it('marks non-link items as active', () => {
		render(<AppRailItem active icon={Library} text='Library' />)

		expect(screen.getByRole('button', { name: 'Library' })).toHaveAttribute(
			'data-status',
			'active',
		)
	})

	it('prefers an explicit aria label over the visible text', () => {
		render(
			<AppRailItem
				ariaLabel='Open library'
				icon={Library}
				text='Library'
			/>,
		)

		expect(
			screen.getByRole('button', { name: 'Open library' }),
		).toBeInTheDocument()
	})
})
