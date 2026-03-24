import { useNavigate } from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SearchDialog } from '../SearchDialog'

const navigateMock = vi.fn()
const useSearchAllMock = vi.fn()
const requestCreateTopicMock = vi.fn()

vi.mock('@tanstack/react-router', async importOriginal => {
	const actual = await importOriginal<typeof import('@tanstack/react-router')>()
	return {
		...actual,
		useNavigate: vi.fn()
	}
})

vi.mock('~/features/search/api/searchAll', () => ({
	useSearchAll: (...args: Array<unknown>) => useSearchAllMock(...args)
}))

vi.mock('~/features/topics/createTopicIntent', () => ({
	requestCreateTopic: () => requestCreateTopicMock()
}))

vi.mock('~/components/masonry-layout/MasonryLayout', () => ({
	MasonryLayout: ({
		items,
		renderItem,
		getItemKey
	}: {
		items: Array<unknown>
		renderItem: (item: any, index: number, laneWidth: number) => ReactNode
		getItemKey?: (item: any, index: number) => string | number
	}) => (
		<div data-testid='masonry-layout'>
			{items.map((item, index) => (
				<div key={getItemKey?.(item, index) ?? index}>
					{renderItem(item, index, 320)}
				</div>
			))}
		</div>
	)
}))

vi.mock('~/features/topics/components/TopicCard', () => ({
	TopicCard: ({
		topic,
		onClick
	}: {
		topic: { title: string }
		onClick?: () => void
	}) => (
		<button onClick={onClick} type='button'>
			{topic.title}
		</button>
	)
}))

vi.mock('~/features/review-cards/components/ReviewCard', () => ({
	ReviewCard: ({
		reviewCard,
		onClick
	}: {
		reviewCard: { prompt: string }
		onClick?: () => void
	}) => (
		<button onClick={onClick} type='button'>
			{reviewCard.prompt}
		</button>
	)
}))

describe('SearchDialog', () => {
	it('uses the global create-topic intent by default', async () => {
		const user = userEvent.setup()
		vi.mocked(useNavigate).mockReturnValue(navigateMock)
		useSearchAllMock.mockReturnValue({ data: [], isLoading: false })

		render(
			<SearchDialog
				onOpenChange={vi.fn()}
				open={true}
				query=''
				setQuery={vi.fn()}
			/>
		)

		await user.click(screen.getByRole('button', { name: /Create topic/i }))

		expect(requestCreateTopicMock).toHaveBeenCalledTimes(1)
		expect(navigateMock).toHaveBeenCalledWith({ to: '/topics' })
	})

	it('uses the contextual create handler when provided', async () => {
		const user = userEvent.setup()
		const onCreate = vi.fn().mockResolvedValue(undefined)
		vi.mocked(useNavigate).mockReturnValue(navigateMock)
		useSearchAllMock.mockReturnValue({ data: [], isLoading: false })

		render(
			<SearchDialog
				createLabel='Create parent'
				onCreate={onCreate}
				onOpenChange={vi.fn()}
				open={true}
				query=''
				setQuery={vi.fn()}
			/>
		)

		await user.click(screen.getByRole('button', { name: /Create parent/i }))

		expect(onCreate).toHaveBeenCalledTimes(1)
		expect(requestCreateTopicMock).not.toHaveBeenCalled()
		expect(navigateMock).not.toHaveBeenCalled()
	})

	it('filters results with filterResult before rendering', () => {
		vi.mocked(useNavigate).mockReturnValue(navigateMock)
		useSearchAllMock.mockReturnValue({
			data: [
				{
					entity_type: 'topic',
					topic: {
						id: 1,
						title: 'Current topic',
						body: '',
						parent_id: null,
						parent_title: null,
						inserted_at: '2026-03-01T12:00:00.000Z',
						updated_at: '2026-03-01T12:00:00.000Z'
					},
					review_card: null,
					recent_activity_at: '2026-03-05T09:00:00.000Z'
				},
				{
					entity_type: 'topic',
					topic: {
						id: 2,
						title: 'Allowed topic',
						body: '',
						parent_id: null,
						parent_title: null,
						inserted_at: '2026-03-01T12:00:00.000Z',
						updated_at: '2026-03-01T12:00:00.000Z'
					},
					review_card: null,
					recent_activity_at: '2026-03-05T08:00:00.000Z'
				}
			],
			isLoading: false
		})

		render(
			<SearchDialog
				filterResult={result =>
					result.entity_type === 'topic' && result.topic?.id !== 1
				}
				onOpenChange={vi.fn()}
				open={true}
				query=''
				setQuery={vi.fn()}
			/>
		)

		expect(
			screen.queryByRole('button', { name: 'Current topic' })
		).not.toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Allowed topic' })
		).toBeInTheDocument()
	})
})
