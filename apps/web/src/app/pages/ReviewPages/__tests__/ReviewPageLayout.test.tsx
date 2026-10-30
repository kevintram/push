import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ReviewPageLayout } from '../ReviewPageLayout'

const { mockToastAdd, mockUseHideMode } = vi.hoisted(() => ({
	mockToastAdd: vi.fn(),
	mockUseHideMode: vi.fn(),
}))

vi.mock('@tanstack/react-router', async importOriginal => ({
	...(await importOriginal<typeof import('@tanstack/react-router')>()),
	Outlet: () => <div data-testid='outlet' />,
}))

vi.mock('~/modules/reviews/hide-mode/useHideMode', () => ({
	useHideMode: mockUseHideMode,
}))

vi.mock('~/components/ui/Toast', () => ({
	toast: { add: mockToastAdd },
}))

describe('ReviewPageLayout', () => {
	beforeEach(() => {
		mockToastAdd.mockReset()
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
		expect(mockToastAdd).toHaveBeenCalledOnce()
		expect(mockToastAdd).toHaveBeenCalledWith({
			title: 'Hide mode has been turned on.',
			type: 'info',
		})
	})

	it('leaves hide mode alone when it is already on', () => {
		const setHideMode = vi.fn()
		mockUseHideMode.mockReturnValue({ hideMode: 'on', setHideMode })

		render(<ReviewPageLayout />)

		expect(setHideMode).not.toHaveBeenCalled()
		expect(mockToastAdd).not.toHaveBeenCalled()
	})
})
