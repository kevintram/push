import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MasonryLayout } from './MasonryLayout'

const useVirtualizerMock = vi.fn()
const useResizeObserverMock = vi.fn()

vi.mock('@tanstack/react-virtual', () => ({
	useVirtualizer: (...args: Array<unknown>) => useVirtualizerMock(...args)
}))

vi.mock('~/app/layouts/PageLayout', () => ({
	usePageScrollElement: () => null
}))

vi.mock('~/hooks/useResizeObserver', () => ({
	useResizeObserver: (...args: Array<unknown>) => useResizeObserverMock(...args)
}))

function buildRect(overrides?: Partial<DOMRectReadOnly>): DOMRectReadOnly {
	return {
		x: 0,
		y: 0,
		width: 960,
		height: 0,
		top: 0,
		left: 0,
		right: 960,
		bottom: 0,
		toJSON: () => ({}),
		...overrides
	}
}

describe('MasonryLayout', () => {
	beforeEach(() => {
		useResizeObserverMock.mockReset()
		useVirtualizerMock.mockReset()
		useResizeObserverMock.mockReturnValue([vi.fn(), buildRect()])
		useVirtualizerMock.mockReturnValue({
			measure: vi.fn(),
			measureElement: vi.fn(),
			getTotalSize: () => 0,
			getVirtualItems: () => [],
			options: {
				scrollMargin: 0
			}
		})
	})

	it('invalidates cached measurements when the measurement version changes', () => {
		const measureSpy = vi.fn()
		useVirtualizerMock.mockReturnValue({
			measure: measureSpy,
			measureElement: vi.fn(),
			getTotalSize: () => 0,
			getVirtualItems: () => [],
			options: {
				scrollMargin: 0
			}
		})

		const items = [{ id: 1 }]
		const props = {
			items,
			renderItem: () => <div>Card</div>,
			estimateItemSize: () => 120,
			getItemKey: (item: { id: number }) => item.id
		}

		const { rerender } = render(
			<MasonryLayout {...props} measurementVersion='off' />
		)

		expect(measureSpy).not.toHaveBeenCalled()

		rerender(<MasonryLayout {...props} measurementVersion='on' />)

		expect(measureSpy).toHaveBeenCalledTimes(1)
	})

	it('does not invalidate measurements when the measurement version stays the same', () => {
		const measureSpy = vi.fn()
		useVirtualizerMock.mockReturnValue({
			measure: measureSpy,
			measureElement: vi.fn(),
			getTotalSize: () => 0,
			getVirtualItems: () => [],
			options: {
				scrollMargin: 0
			}
		})

		const items = [{ id: 1 }]
		const props = {
			items,
			renderItem: () => <div>Card</div>,
			estimateItemSize: () => 120,
			getItemKey: (item: { id: number }) => item.id
		}

		const { rerender } = render(
			<MasonryLayout {...props} measurementVersion='off' />
		)

		rerender(<MasonryLayout {...props} measurementVersion='off' />)

		expect(measureSpy).not.toHaveBeenCalled()
	})
})
