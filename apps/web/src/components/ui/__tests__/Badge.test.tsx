import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Badge } from '../Badge'

describe('Badge', () => {
	it('renders children', () => {
		render(<Badge>New</Badge>)
		expect(screen.getByText('New')).toBeInTheDocument()
	})

	it('renders a span by default', () => {
		render(<Badge>New</Badge>)
		expect(screen.getByText('New').tagName).toBe('SPAN')
	})

	it('marks itself with a badge slot', () => {
		render(<Badge>New</Badge>)
		expect(screen.getByText('New')).toHaveAttribute('data-slot', 'badge')
	})

	it('renders with different variants', () => {
		const { rerender } = render(<Badge variant='solid'>Solid</Badge>)
		expect(screen.getByText('Solid')).toBeInTheDocument()

		rerender(<Badge variant='secondary'>Secondary</Badge>)
		expect(screen.getByText('Secondary')).toBeInTheDocument()

		rerender(<Badge variant='outline'>Outline</Badge>)
		expect(screen.getByText('Outline')).toBeInTheDocument()

		rerender(<Badge variant='ghost'>Ghost</Badge>)
		expect(screen.getByText('Ghost')).toBeInTheDocument()

		rerender(<Badge variant='danger'>Danger</Badge>)
		expect(screen.getByText('Danger')).toBeInTheDocument()
	})

	it('renders as a link via the render prop', () => {
		render(<Badge render={<a href='/library' />}>Library</Badge>)

		const link = screen.getByRole('link', { name: 'Library' })
		expect(link).toHaveAttribute('href', '/library')
	})

	it('forwards additional props to the rendered element', () => {
		render(<Badge aria-label='Two unread'>2</Badge>)
		expect(screen.getByLabelText('Two unread')).toBeInTheDocument()
	})
})
