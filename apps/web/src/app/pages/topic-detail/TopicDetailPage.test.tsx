import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import {
	parentTopic,
	topic,
	useTopicMock,
	useTopicsMock
} from '../test-support/detailPageTestSupport'
import { TopicDetailPage } from './TopicDetailPage'

describe('TopicDetailPage', () => {
	it('renders a read-only breadcrumb path from root to current topic', () => {
		const rootTopic = {
			...topic,
			id: 4,
			title: 'Mathematics',
			parent_id: null,
			parent_title: null
		}
		const branchTopic = {
			...topic,
			id: 2,
			title: 'Algebra',
			parent_id: 4,
			parent_title: 'Mathematics'
		}
		const currentTopic = {
			...topic,
			id: 3,
			title: 'Linear equations',
			parent_id: 2,
			parent_title: 'Algebra'
		}

		useTopicMock.mockImplementation((topicId: number | null) => {
			if (topicId === 3) {
				return { data: currentTopic, isLoading: false, error: null }
			}

			return { data: null, isLoading: false, error: null }
		})
		useTopicsMock.mockImplementation(
			(params?: { parent_id?: number; sort?: string; order?: string }) => {
				if (params?.sort === 'title' && params?.order === 'asc') {
					return {
						data: [rootTopic, branchTopic, currentTopic],
						isLoading: false
					}
				}

				return { data: [], isLoading: false }
			}
		)

		render(
			<TopicDetailPage
				cardTypeFilter='all'
				onCardTypeFilterChange={() => {}}
				topicId={3}
			/>
		)

		const breadcrumb = screen.getByRole('navigation', { name: 'Topic path' })

		expect(
			within(breadcrumb).getByRole('link', { name: 'Mathematics' })
		).toBeInTheDocument()
		expect(
			within(breadcrumb).getByRole('link', { name: 'Algebra' })
		).toBeInTheDocument()
		expect(within(breadcrumb).getByText('Linear equations')).toBeInTheDocument()
		expect(
			within(breadcrumb).queryByRole('link', { name: 'Linear equations' })
		).not.toBeInTheDocument()
		expect(
			within(breadcrumb).getByText('Linear equations').closest('a')
		).toBeNull()
		expect(
			screen.queryByRole('button', { name: /Add parent/i })
		).not.toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: /Remove parent/i })
		).not.toBeInTheDocument()
	})

	it('syncs topic fields on first load and only refreshes untouched fields on refetch', async () => {
		const user = userEvent.setup()
		let currentTopic = { ...topic }

		useTopicMock.mockImplementation((topicId: number | null) => {
			if (topicId === 1) {
				return { data: currentTopic, isLoading: false, error: null }
			}
			if (topicId === 2) {
				return { data: parentTopic, isLoading: false, error: null }
			}
			return { data: null, isLoading: false, error: null }
		})

		const { rerender } = render(
			<TopicDetailPage
				cardTypeFilter='all'
				onCardTypeFilterChange={() => {}}
				topicId={1}
			/>
		)

		await waitFor(() => {
			expect(screen.getByDisplayValue(topic.title)).toBeInTheDocument()
			expect(screen.getByDisplayValue(topic.body)).toBeInTheDocument()
		})

		const titleField = screen.getByDisplayValue(topic.title)
		await user.clear(titleField)
		await user.type(titleField, 'Algebra draft')

		currentTopic = {
			...currentTopic,
			title: 'Algebra from server',
			body: 'Updated body from server'
		}

		rerender(
			<TopicDetailPage
				cardTypeFilter='all'
				onCardTypeFilterChange={() => {}}
				topicId={1}
			/>
		)

		await waitFor(() => {
			expect(screen.getByDisplayValue('Algebra draft')).toBeInTheDocument()
			expect(
				screen.getByDisplayValue('Updated body from server')
			).toBeInTheDocument()
		})
	})
})
