import { render, screen } from '@testing-library/react'
import { Copy } from 'lucide-react'
import type { ReactNode } from 'react'
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
		const toggleHideMode = vi.fn()
		mockUseHideMode.mockReturnValue({
			hideMode: 'off',
			setHideMode,
			toggleHideMode,
		})

		render(<ReviewPageLayout />)

		expect(setHideMode).toHaveBeenCalledOnce()
		expect(setHideMode).toHaveBeenCalledWith('on')
		expect(mockToastAdd).toHaveBeenCalledOnce()
		expect(mockToastAdd).toHaveBeenCalledWith(
			expect.objectContaining({
				actionProps: expect.objectContaining({
					'aria-keyshortcuts': 'Shift+R',
					onClick: toggleHideMode,
				}),
				data: { icon: Copy },
				type: 'info',
			}),
		)
	})

	it.each([
		[
			'on',
			'Hide mode on',
			'Answers stay hidden until you reveal them',
			'Turn off',
		],
		['off', 'Hide mode off', 'Answers and notes are showing', 'Turn on'],
	] as const)(
		'words the toast for hide mode %s',
		(hideMode, title, description, action) => {
			mockUseHideMode.mockReturnValue({
				hideMode: 'off',
				setHideMode: vi.fn(),
				toggleHideMode: vi.fn(),
			})
			render(<ReviewPageLayout />)
			const [options] = mockToastAdd.mock.calls[0] as unknown as [
				{
					actionProps: { children: ReactNode }
					description: ReactNode
					title: ReactNode
				},
			]

			// The toast renders after the mode has changed.
			mockUseHideMode.mockReturnValue({ hideMode })
			render(
				<>
					<p>{options.title}</p>
					<p>{options.description}</p>
					<button type='button'>
						{options.actionProps.children}
					</button>
				</>,
			)

			expect(screen.getByText(title)).toBeInTheDocument()
			expect(screen.getByText(description)).toBeInTheDocument()
			expect(screen.getByRole('button')).toHaveTextContent(action)
			expect(screen.getByRole('button')).toHaveTextContent('R')
		},
	)

	it('leaves hide mode alone when it is already on', () => {
		const setHideMode = vi.fn()
		mockUseHideMode.mockReturnValue({ hideMode: 'on', setHideMode })

		render(<ReviewPageLayout />)

		expect(setHideMode).not.toHaveBeenCalled()
		expect(mockToastAdd).not.toHaveBeenCalled()
	})
})
