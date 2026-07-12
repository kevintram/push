import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
		const { rerender } = render(<Button variant='default'>Default</Button>)
		expect(screen.getByRole('button')).toBeInTheDocument()

		rerender(<Button variant='secondary'>Secondary</Button>)
		expect(screen.getByRole('button')).toBeInTheDocument()

		rerender(<Button variant='outline'>Outline</Button>)
		expect(screen.getByRole('button')).toBeInTheDocument()

		rerender(<Button variant='ghost'>Ghost</Button>)
		expect(screen.getByRole('button')).toBeInTheDocument()
	})

	it('renders with different sizes', () => {
		const { rerender } = render(<Button size='sm'>Small</Button>)
		expect(screen.getByRole('button')).toBeInTheDocument()

		rerender(<Button size='default'>Default</Button>)
		expect(screen.getByRole('button')).toBeInTheDocument()

		rerender(<Button size='lg'>Large</Button>)
		expect(screen.getByRole('button')).toBeInTheDocument()

		rerender(<Button size='icon'>Icon</Button>)
		expect(screen.getByRole('button')).toBeInTheDocument()
	})

	it('forwards ref to the button element', () => {
		const ref = { current: null }
		render(<Button ref={ref}>Click me</Button>)

		expect(ref.current).toBeInstanceOf(HTMLButtonElement)
	})
})
