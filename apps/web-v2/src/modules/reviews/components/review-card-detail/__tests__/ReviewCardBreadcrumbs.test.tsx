import type { Id } from '@convex/_generated/dataModel'
import type { Topic } from '@convex/validators/topics'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	detail: vi.fn(),
	useSuspenseQuery: vi.fn(),
	topicPathBreadcrumbs: vi.fn((_props: unknown) => null),
}))

vi.mock('@tanstack/react-query', () => ({
	useSuspenseQuery: mocks.useSuspenseQuery,
}))

vi.mock('~/modules/library/api/topicQueries', () => ({
	topicQueries: { detail: mocks.detail },
}))

vi.mock('~/modules/library/components/TopicPathBreadcrumbs', () => ({
	TopicPathBreadcrumbs: mocks.topicPathBreadcrumbs,
}))

import { ReviewCardBreadcrumbs } from '../ReviewCardBreadcrumbs'

function topic(id: string, title = id): Topic {
	return {
		_id: id as Id<'topics'>,
		_creationTime: 0,
		title,
		description: '',
		ownerId: 'owner',
		path: [],
		searchText: title,
	}
}

describe('ReviewCardBreadcrumbs', () => {
	beforeEach(() => {
		mocks.detail.mockReturnValue('topic-detail-query')
		mocks.useSuspenseQuery.mockReturnValue({
			data: {
				...topic('current'),
				path: [topic('ancestor')],
			},
		})
		mocks.topicPathBreadcrumbs.mockClear()
	})

	it('fetches the expanded topic and delegates the complete path', () => {
		const topicId = 'current' as Id<'topics'>
		const onNavigate = vi.fn()

		render(
			<ReviewCardBreadcrumbs
				primaryText='A review card'
				topicId={topicId}
				onNavigate={onNavigate}
			/>,
		)

		expect(mocks.detail).toHaveBeenCalledWith(topicId, { expandPath: true })
		expect(mocks.useSuspenseQuery).toHaveBeenCalledWith(
			'topic-detail-query',
		)
		const delegatedProps = mocks.topicPathBreadcrumbs.mock.calls[0]?.[0]
		expect(delegatedProps).toEqual(
			expect.objectContaining({
				topics: [
					expect.objectContaining({ _id: 'ancestor' }),
					expect.objectContaining({ _id: 'current' }),
				],
				currentLabel: 'A review card',
				onNavigate,
			}),
		)
	})
})
