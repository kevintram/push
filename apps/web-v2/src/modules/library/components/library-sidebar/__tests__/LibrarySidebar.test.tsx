import { act, render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LibrarySidebar } from '../LibrarySidebar'

type TestDragEndEvent = {
	canceled: boolean
	operation: {
		source?: { id?: string } | null
		target?: { id?: string } | null
	}
}

const mocks = vi.hoisted(() => ({
	onDragEnd: undefined as ((event: TestDragEndEvent) => void) | undefined,
	updateTopic: vi.fn(),
}))

vi.mock('@dnd-kit/react', () => ({
	DragDropProvider: ({
		children,
		onDragEnd,
	}: {
		children: ReactNode
		onDragEnd: (event: TestDragEndEvent) => void
	}) => {
		mocks.onDragEnd = onDragEnd
		return children
	},
}))

vi.mock('@tanstack/react-query', () => ({
	useSuspenseQuery: () => ({ data: [] }),
}))

vi.mock('../../../api/topicQueries', () => ({
	topicQueries: { list: () => ({}) },
	useUpdateTopic: () => ({ mutate: mocks.updateTopic }),
}))

vi.mock('../LibrarySidebarContent', () => ({
	LibrarySidebarContent: () => <div>Library sidebar content</div>,
}))

function finishDrag(event: TestDragEndEvent) {
	act(() => mocks.onDragEnd?.(event))
}

describe('LibrarySidebar drag and drop', () => {
	beforeEach(() => {
		mocks.onDragEnd = undefined
		mocks.updateTopic.mockClear()
	})

	it('reparents a topic when dropped onto another topic', () => {
		render(<LibrarySidebar />)

		finishDrag({
			canceled: false,
			operation: {
				source: { id: 'source-topic' },
				target: { id: 'parent-topic' },
			},
		})

		expect(mocks.updateTopic).toHaveBeenCalledWith({
			topicId: 'source-topic',
			parentId: 'parent-topic',
		})
	})

	it('moves a topic to the root when dropped onto the library header', () => {
		render(<LibrarySidebar />)

		finishDrag({
			canceled: false,
			operation: {
				source: { id: 'source-topic' },
				target: { id: 'library-root' },
			},
		})

		expect(mocks.updateTopic).toHaveBeenCalledWith({
			topicId: 'source-topic',
			parentId: null,
		})
	})

	it.each([
		{
			name: 'the drag was canceled',
			event: {
				canceled: true,
				operation: {
					source: { id: 'source-topic' },
					target: { id: 'parent-topic' },
				},
			},
		},
		{
			name: 'the source is missing',
			event: {
				canceled: false,
				operation: { target: { id: 'parent-topic' } },
			},
		},
		{
			name: 'the target is missing',
			event: {
				canceled: false,
				operation: { source: { id: 'source-topic' } },
			},
		},
		{
			name: 'the source and target are the same topic',
			event: {
				canceled: false,
				operation: {
					source: { id: 'same-topic' },
					target: { id: 'same-topic' },
				},
			},
		},
	])('does not update a topic when $name', ({ event }) => {
		render(<LibrarySidebar />)

		finishDrag(event)

		expect(mocks.updateTopic).not.toHaveBeenCalled()
	})
})
