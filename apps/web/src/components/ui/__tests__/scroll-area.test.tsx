import { act, render, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { ScrollArea } from "../scroll-area"

class ResizeObserverStub {
	static instances: Array<ResizeObserverStub> = []

	callback: ResizeObserverCallback

	constructor(callback: ResizeObserverCallback) {
		this.callback = callback
		ResizeObserverStub.instances.push(this)
	}

	disconnect() {}

	observe() {}

	unobserve() {}

	static triggerAll() {
		for (const observer of ResizeObserverStub.instances) {
			observer.callback([], observer as unknown as ResizeObserver)
		}
	}

	static reset() {
		ResizeObserverStub.instances = []
	}
}

function setViewportDimensions(
	viewport: HTMLElement,
	{
		clientHeight,
		scrollHeight,
		clientWidth = 100,
		scrollWidth = 100,
	}: {
		clientHeight: number
		scrollHeight: number
		clientWidth?: number
		scrollWidth?: number
	},
) {
	Object.defineProperties(viewport, {
		clientHeight: {
			configurable: true,
			value: clientHeight,
		},
		clientWidth: {
			configurable: true,
			value: clientWidth,
		},
		scrollHeight: {
			configurable: true,
			value: scrollHeight,
		},
		scrollWidth: {
			configurable: true,
			value: scrollWidth,
		},
		scrollTop: {
			configurable: true,
			value: 0,
			writable: true,
		},
		scrollLeft: {
			configurable: true,
			value: 0,
			writable: true,
		},
	})
}

describe("ScrollArea", () => {
	const originalResizeObserver = globalThis.ResizeObserver

	beforeEach(() => {
		ResizeObserverStub.reset()
		globalThis.ResizeObserver =
			ResizeObserverStub as unknown as typeof ResizeObserver
	})

	afterEach(() => {
		globalThis.ResizeObserver = originalResizeObserver
		ResizeObserverStub.reset()
	})

	it("hides the scrollbar when the viewport does not overflow", async () => {
		const { container } = render(
			<ScrollArea className='h-24'>
				<div>Content</div>
			</ScrollArea>,
		)

		const viewport = container.querySelector(
			'[data-slot="scroll-area-viewport"]',
		)

		expect(viewport).not.toBeNull()

		setViewportDimensions(viewport as HTMLElement, {
			clientHeight: 100,
			scrollHeight: 100,
		})

		await act(async () => {
			ResizeObserverStub.triggerAll()
			ResizeObserverStub.triggerAll()
		})

		await waitFor(() => {
			expect(
				container.querySelector('[data-slot="scroll-area-scrollbar"]'),
			).not.toBeInTheDocument()
		})
	})

	it("keeps the scrollbar when the viewport overflows", async () => {
		const { container } = render(
			<ScrollArea className='h-24'>
				<div>Content</div>
			</ScrollArea>,
		)

		const viewport = container.querySelector(
			'[data-slot="scroll-area-viewport"]',
		)

		expect(viewport).not.toBeNull()

		setViewportDimensions(viewport as HTMLElement, {
			clientHeight: 100,
			scrollHeight: 200,
		})

		await act(async () => {
			ResizeObserverStub.triggerAll()
			ResizeObserverStub.triggerAll()
		})

		await waitFor(() => {
			expect(
				container.querySelector('[data-slot="scroll-area-scrollbar"]'),
			).toBeInTheDocument()
		})
	})
})
