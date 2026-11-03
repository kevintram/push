import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ReviewPageLayout } from '../ReviewPageLayout'

const { mockUseHideMode } = vi.hoisted(() => ({
	mockUseHideMode: vi.fn(),
}))

vi.mock('@tanstack/react-router', async importOriginal => ({
	...(await importOriginal<typeof import('@tanstack/react-router')>()),
	Outlet: () => <div data-testid='outlet' />,
}))

vi.mock('~/modules/reviews/hide-mode/useHideMode', () => ({
	useHideMode: mockUseHideMode,
}))

describe('ReviewPageLayout', () => {
	beforeEach(() => {
		mockUseHideMode.mockReset()
	})

	it('renders the routed page content via Outlet', () => {
		mockUseHideMode.mockReturnValue({
			hideMode: 'on',
			autoEnableHideMode: vi.fn(),
		})

		render(<ReviewPageLayout />)

		expect(screen.getByTestId('outlet')).toBeInTheDocument()
	})

	it('turns on hide mode with a toast when entering review', () => {
		const autoEnableHideMode = vi.fn()
		mockUseHideMode.mockReturnValue({ hideMode: 'off', autoEnableHideMode })

		render(<ReviewPageLayout />)

		expect(autoEnableHideMode).toHaveBeenCalledOnce()
	})

	it('leaves hide mode alone when it is already on', () => {
		const autoEnableHideMode = vi.fn()
		mockUseHideMode.mockReturnValue({ hideMode: 'on', autoEnableHideMode })

		render(<ReviewPageLayout />)

		expect(autoEnableHideMode).not.toHaveBeenCalled()
	})
})
