import { act, render, screen } from '@testing-library/react'
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
		render(<NotAuthenticatedPage />)

		expect(screen.getByRole('status')).toBeInTheDocument()
	})

	it('can delay authentication progress to avoid flashing', () => {
		render(<NotAuthenticatedPage delayMs={300} />)

		expect(screen.queryByRole('status')).not.toBeInTheDocument()
		act(() => {
			vi.advanceTimersByTime(299)
		})
		expect(screen.queryByRole('status')).not.toBeInTheDocument()

		act(() => {
			vi.advanceTimersByTime(1)
		})
		expect(screen.getByRole('status')).toBeInTheDocument()
	})
})
