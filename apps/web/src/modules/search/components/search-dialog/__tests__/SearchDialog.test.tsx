import { useNavigate } from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { SearchDialog } from '../SearchDialog'

const navigateMock = vi.fn()
const useSearchAllMock = vi.fn()

vi.mock('@tanstack/react-router', async importOriginal => {
	const actual =
		await importOriginal<typeof import('@tanstack/react-router')>()
	return {
		...actual,
		useNavigate: vi.fn(),
	}
})

vi.mock('~/modules/search/api/searchAll', () => ({
	useSearchAll: (...args: Array<unknown>) => useSearchAllMock(...args),
}))

vi.mock('~/components/masonry-layout/MasonryLayout', () => ({
	MasonryLayout: ({
		items,
		renderItem,
		getItemKey,
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
	),
}))

vi.mock('~/modules/topics/components/TopicCard', () => ({
	TopicCard: ({
		topic,
		onClick,
	}: {
		topic: { title: string }
		onClick?: () => void
	}) => (
		<button onClick={onClick} type='button'>
			{topic.title}
		</button>
	),
}))

vi.mock('~/modules/review-cards/components/ReviewCard', () => ({
	ReviewCard: ({
		reviewCard,
		onClick,
	}: {
		reviewCard: { primaryText: string }
		onClick?: () => void
	}) => (
		<button onClick={onClick} type='button'>
			{reviewCard.primaryText}
		</button>
	),
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
			/>,
		)

		await user.click(screen.getByRole('button', { name: /Create topic/iu }))

		expect(navigateMock).toHaveBeenCalledWith({
			to: '/library',
			search: { create: true },
		})
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
			/>,
		)

		await user.click(
			screen.getByRole('button', { name: /Create parent/iu }),
		)

		expect(onCreate).toHaveBeenCalledTimes(1)
		expect(navigateMock).not.toHaveBeenCalled()
	})

	it('filters results with filterResult before rendering', () => {
		vi.mocked(useNavigate).mockReturnValue(navigateMock)
		useSearchAllMock.mockReturnValue({
			data: [
				{
					entityType: 'topic',
					topic: {
						id: 1,
						title: 'Current topic',
						body: '',
						parentId: null,
						parentTitle: null,
						insertedAt: '2026-03-01T12:00:00.000Z',
						updatedAt: '2026-03-01T12:00:00.000Z',
					},
					reviewCard: null,
					recentActivityAt: '2026-03-05T09:00:00.000Z',
				},
				{
					entityType: 'topic',
					topic: {
						id: 2,
						title: 'Allowed topic',
						body: '',
						parentId: null,
						parentTitle: null,
						insertedAt: '2026-03-01T12:00:00.000Z',
						updatedAt: '2026-03-01T12:00:00.000Z',
					},
					reviewCard: null,
					recentActivityAt: '2026-03-05T08:00:00.000Z',
				},
			],
			isLoading: false,
		})

		render(
			<SearchDialog
				filterResult={result =>
					result.entityType === 'topic' && result.topic?.id !== 1
				}
				onOpenChange={vi.fn()}
				open={true}
				query=''
				setQuery={vi.fn()}
			/>,
		)

		expect(
			screen.queryByRole('button', { name: 'Current topic' }),
		).not.toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Allowed topic' }),
		).toBeInTheDocument()
	})
})
