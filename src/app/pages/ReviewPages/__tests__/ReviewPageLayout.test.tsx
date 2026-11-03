import { render, screen } from '@testing-library/react'
import { Copy } from 'lucide-react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ReviewPageLayout } from '../ReviewPageLayout'

const { mockToastAdd, mockToastClose, mockUseHideMode } = vi.hoisted(() => ({
	mockToastAdd: vi.fn(() => 'toast-id'),
	mockToastClose: vi.fn(),
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
	toast: { add: mockToastAdd, close: mockToastClose },
}))

describe('ReviewPageLayout', () => {
	beforeEach(() => {
		mockToastAdd.mockClear()
		mockToastClose.mockReset()
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
			actionProps: {
				children: 'Turn off',
				onClick: expect.any(Function),
			},
			data: { icon: Copy },
			description: 'Answers stay hidden until you reveal them',
			title: 'Hide mode on',
			type: 'info',
		})
	})

	it('turns hide mode back off from the toast', () => {
		const setHideMode = vi.fn()
		mockUseHideMode.mockReturnValue({ hideMode: 'off', setHideMode })

		render(<ReviewPageLayout />)
		setHideMode.mockClear()

		const [options] = mockToastAdd.mock.calls[0] as unknown as [
			{ actionProps: { onClick: () => void } },
		]
		options.actionProps.onClick()

		expect(mockToastClose).toHaveBeenCalledWith('toast-id')
		expect(setHideMode).toHaveBeenCalledOnce()
		expect(setHideMode).toHaveBeenCalledWith('off')
	})

	it('leaves hide mode alone when it is already on', () => {
		const setHideMode = vi.fn()
		mockUseHideMode.mockReturnValue({ hideMode: 'on', setHideMode })

		render(<ReviewPageLayout />)

		expect(setHideMode).not.toHaveBeenCalled()
		expect(mockToastAdd).not.toHaveBeenCalled()
	})
})
