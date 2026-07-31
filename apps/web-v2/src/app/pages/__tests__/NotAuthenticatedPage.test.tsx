import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { NotAuthenticatedPage } from '../NotAuthenticatedPage'

describe('NotAuthenticatedPage', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('shows authentication progress', () => {
		render(<NotAuthenticatedPage onRetry={vi.fn()} />)

		expect(screen.getByRole('status')).toBeInTheDocument()
	})

	it('hides the retry button while sign-in is still plausibly in progress', () => {
		render(<NotAuthenticatedPage onRetry={vi.fn()} />)

		expect(
			screen.queryByRole('button', { name: 'Retry' }),
		).not.toBeInTheDocument()
	})

	it('offers a retry once the wait looks stuck', () => {
		const onRetry = vi.fn()

		render(<NotAuthenticatedPage onRetry={onRetry} />)
		act(() => {
			vi.advanceTimersByTime(5000)
		})

		fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

		expect(onRetry).toHaveBeenCalledOnce()
	})
})
