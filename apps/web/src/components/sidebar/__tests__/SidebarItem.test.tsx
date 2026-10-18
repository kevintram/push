import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Library, Search } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'

import { SidebarItem } from '../SidebarItem'

describe('SidebarItem', () => {
	it('renders a button by default and reports clicks', async () => {
		const user = userEvent.setup()
		const onClick = vi.fn()
		render(
			<SidebarItem icon={Library} onClick={onClick}>
				Library
			</SidebarItem>,
		)

		const item = screen.getByRole('button', { name: 'Library' })
		expect(item).toHaveAttribute('type', 'button')

		await user.click(item)
		expect(onClick).toHaveBeenCalledOnce()
	})

	it('renders as the element passed through render', () => {
		render(
			<SidebarItem icon={Library} render={<a href='/library' />}>
				Library
			</SidebarItem>,
		)

		const item = screen.getByRole('link', { name: 'Library' })
		expect(item).toHaveAttribute('href', '/library')
		expect(item).not.toHaveAttribute('type')
	})

	it('marks non-link items as active', () => {
		render(
			<SidebarItem active icon={Library}>
				Library
			</SidebarItem>,
		)

		expect(screen.getByRole('button', { name: 'Library' })).toHaveAttribute(
			'data-status',
			'active',
		)
	})

	it('prefers an explicit aria label over the visible text', () => {
		render(
			<SidebarItem aria-label='Open library' icon={Library}>
				Library
			</SidebarItem>,
		)

		expect(
			screen.getByRole('button', { name: 'Open library' }),
		).toBeInTheDocument()
	})

	it('renders custom content', () => {
		render(
			<SidebarItem aria-label='Library, cards available' icon={Library}>
				Library
				<span aria-label='Cards available' role='img' />
			</SidebarItem>,
		)

		expect(
			screen.getByRole('img', { name: 'Cards available' }),
		).toBeInTheDocument()
	})

	it('keeps icon-only items accessible', () => {
		render(
			<SidebarItem aria-label='Search' iconOnly>
				<Search aria-hidden='true' />
			</SidebarItem>,
		)

		const item = screen.getByRole('button', { name: 'Search' })
		expect(item).toHaveAttribute('type', 'button')
		expect(item.querySelectorAll('svg')).toHaveLength(1)
	})
})
