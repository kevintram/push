import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Plus, Search, Star } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'

import { Button } from '../Button'

describe('Button', () => {
	it('renders children', () => {
		render(<Button>Click me</Button>)
		expect(
			screen.getByRole('button', { name: 'Click me' }),
		).toBeInTheDocument()
	})

	it('handles click events', async () => {
		const user = userEvent.setup()
		const handleClick = vi.fn()

		render(<Button onClick={handleClick}>Click me</Button>)
		await user.click(screen.getByRole('button'))

		expect(handleClick).toHaveBeenCalledOnce()
	})

	it('can be disabled', async () => {
		const user = userEvent.setup()
		const handleClick = vi.fn()

		render(
			<Button disabled onClick={handleClick}>
				Click me
			</Button>,
		)

		const button = screen.getByRole('button')
		expect(button).toBeDisabled()

		await user.click(button)
		expect(handleClick).not.toHaveBeenCalled()
	})

	it('renders with different variants', () => {
		const { rerender } = render(<Button variant='primary'>Primary</Button>)
		expect(screen.getByRole('button')).toBeInTheDocument()

		rerender(<Button variant='secondary'>Secondary</Button>)
		expect(screen.getByRole('button')).toBeInTheDocument()

		rerender(<Button variant='outline'>Outline</Button>)
		expect(screen.getByRole('button')).toBeInTheDocument()

		rerender(<Button variant='ghost'>Ghost</Button>)
		expect(screen.getByRole('button')).toBeInTheDocument()

		rerender(<Button variant='danger'>Danger</Button>)
		expect(screen.getByRole('button')).toBeInTheDocument()
	})

	it('renders with different sizes', () => {
		const { rerender } = render(<Button size='micro'>Micro</Button>)
		expect(screen.getByRole('button')).toBeInTheDocument()

		rerender(<Button size='tiny'>Tiny</Button>)
		expect(screen.getByRole('button')).toBeInTheDocument()

		rerender(<Button size='small'>Small</Button>)
		expect(screen.getByRole('button')).toBeInTheDocument()

		rerender(<Button size='medium'>Medium</Button>)
		expect(screen.getByRole('button')).toBeInTheDocument()

		rerender(<Button size='large'>Large</Button>)
		expect(screen.getByRole('button')).toBeInTheDocument()
	})

	it('supports square and round shapes', () => {
		const { rerender } = render(<Button shape='square'>Square</Button>)
		expect(screen.getByRole('button')).toBeInTheDocument()

		rerender(<Button shape='round'>Round</Button>)
		expect(screen.getByRole('button')).toBeInTheDocument()
	})

	it('keeps icon-only buttons accessible', () => {
		render(
			<Button aria-label='Favorite review' iconOnly>
				<Star aria-hidden='true' />
			</Button>,
		)

		expect(
			screen.getByRole('button', { name: 'Favorite review' }),
		).toBeInTheDocument()
	})

	it('renders child icon and label bundles', () => {
		render(
			<Button>
				<Search aria-hidden='true' />
				Search
				<Plus aria-hidden='true' />
			</Button>,
		)

		const button = screen.getByRole('button', { name: 'Search' })
		expect(button.querySelectorAll('svg')).toHaveLength(2)
	})

	it('supports square and round icon buttons', () => {
		const { rerender } = render(
			<Button aria-label='Add' iconOnly>
				<Plus aria-hidden='true' />
			</Button>,
		)

		expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()

		rerender(
			<Button aria-label='Add' iconOnly shape='round'>
				<Plus aria-hidden='true' />
			</Button>,
		)

		expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
	})

	it('forwards ref to the button element', () => {
		const ref = { current: null }
		render(<Button ref={ref}>Click me</Button>)

		expect(ref.current).toBeInstanceOf(HTMLButtonElement)
	})

	it('supports Base UI render composition', () => {
		render(<Button render={<a href='/library' />}>Open library</Button>)

		expect(
			screen.getByRole('link', { name: 'Open library' }),
		).toHaveAttribute('href', '/library')
	})
})
