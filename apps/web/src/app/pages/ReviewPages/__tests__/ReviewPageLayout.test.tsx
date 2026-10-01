import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ReviewPageLayout } from '../ReviewPageLayout'

const { mockToastInfo, mockUseHideMode } = vi.hoisted(() => ({
	mockToastInfo: vi.fn(),
	mockUseHideMode: vi.fn(),
}))

vi.mock('@tanstack/react-router', async importOriginal => ({
	...(await importOriginal<typeof import('@tanstack/react-router')>()),
	Outlet: () => <div data-testid='outlet' />,
}))

vi.mock('~/modules/reviews/hide-mode/useHideMode', () => ({
	useHideMode: mockUseHideMode,
}))

vi.mock('sonner', () => ({
	toast: { info: mockToastInfo },
}))

describe('ReviewPageLayout', () => {
	beforeEach(() => {
		mockToastInfo.mockReset()
		mockUseHideMode.mockReset()
	})

	it('renders the routed page content via Outlet', () => {
		mockUseHideMode.mockReturnValue({
			hideMode: 'on',
			setHideMode: vi.fn(),
		})

		render(<ReviewPageLayout />)

		expect(screen.getByTestId('outlet')).toBeInTheDocument()
	})

	it('turns on hide mode and announces the change when entering review', () => {
		const setHideMode = vi.fn()
		mockUseHideMode.mockReturnValue({ hideMode: 'off', setHideMode })

		render(<ReviewPageLayout />)

		expect(setHideMode).toHaveBeenCalledOnce()
		expect(setHideMode).toHaveBeenCalledWith('on')
		expect(mockToastInfo).toHaveBeenCalledOnce()
		expect(mockToastInfo).toHaveBeenCalledWith(
			'Hide mode has been turned on.',
		)
	})

	it('leaves hide mode alone when it is already on', () => {
		const setHideMode = vi.fn()
		mockUseHideMode.mockReturnValue({ hideMode: 'on', setHideMode })

		render(<ReviewPageLayout />)

		expect(setHideMode).not.toHaveBeenCalled()
		expect(mockToastInfo).not.toHaveBeenCalled()
	})
})
