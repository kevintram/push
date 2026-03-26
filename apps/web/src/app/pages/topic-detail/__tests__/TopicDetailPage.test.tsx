import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import {
	parentTopic,
	topic,
	useTopicMock,
	useTopicsMock
} from '~/testing/support/detailPageTestSupport'
import { TopicDetailPage } from '../TopicDetailPage'

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
			screen.queryByRole('button', { name: /Add parent/iu })
		).not.toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: /Remove parent/iu })
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

	it('renders the ToC from the current document subtree', () => {
		const rootTopic = {
			...topic,
			id: 1,
			title: 'Mathematics',
			parent_id: null,
			parent_title: null
		}
		const childTopic = {
			...topic,
			id: 2,
			title: 'Algebra',
			parent_id: 1,
			parent_title: 'Mathematics'
		}
		const grandchildTopic = {
			...topic,
			id: 3,
			title: 'Linear Algebra',
			parent_id: 2,
			parent_title: 'Algebra'
		}
		const unrelatedGlobalChild = {
			...topic,
			id: 4,
			title: 'Computer Science',
			parent_id: 1,
			parent_title: 'Mathematics'
		}

		useTopicMock.mockImplementation((topicId: number | null) => {
			if (topicId === 1) {
				return { data: rootTopic, isLoading: false, error: null }
			}

			return { data: null, isLoading: false, error: null }
		})
		useTopicsMock.mockImplementation(
			(params?: { subtree_of?: number; sort?: string; order?: string }) => {
				if (
					params?.subtree_of === 1 &&
					params.sort === 'title' &&
					params.order === 'asc'
				) {
					return {
						data: [rootTopic, childTopic, grandchildTopic],
						isLoading: false
					}
				}

				if (params?.sort === 'title' && params?.order === 'asc') {
					return {
						data: [
							rootTopic,
							childTopic,
							grandchildTopic,
							unrelatedGlobalChild
						],
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
				topicId={1}
			/>
		)

		const toc = screen.getByRole('navigation', { name: 'On this page' })

		expect(within(toc).queryByText('Mathematics')).not.toBeInTheDocument()
		expect(within(toc).getByText('Algebra')).toBeInTheDocument()
		expect(within(toc).getByText('Linear Algebra')).toBeInTheDocument()
		expect(within(toc).queryByText('Computer Science')).not.toBeInTheDocument()
	})

	it('keeps the root out of the ToC and allows leaf sections to collapse', async () => {
		const user = userEvent.setup()
		const rootTopic = {
			...topic,
			id: 1,
			title: 'Mathematics',
			parent_id: null,
			parent_title: null
		}
		const leafTopic = {
			...topic,
			id: 2,
			title: 'Algebra',
			body: 'Leaf topic body',
			parent_id: 1,
			parent_title: 'Mathematics'
		}

		useTopicMock.mockImplementation((topicId: number | null) => {
			if (topicId === 1) {
				return { data: rootTopic, isLoading: false, error: null }
			}

			return { data: null, isLoading: false, error: null }
		})
		useTopicsMock.mockImplementation(
			(params?: { subtree_of?: number; sort?: string; order?: string }) => {
				if (params?.sort === 'title' && params?.order === 'asc') {
					return {
						data:
							params?.subtree_of === 1
								? [rootTopic, leafTopic]
								: [rootTopic, leafTopic],
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
				topicId={1}
			/>
		)

		const toc = screen.getByRole('navigation', { name: 'On this page' })

		expect(within(toc).queryByText('Mathematics')).not.toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Collapse Algebra' })
		).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Collapse Algebra' }))

		expect(screen.queryByText('Leaf topic body')).not.toBeInTheDocument()
	})

	it('supports expanding and collapsing topics in the ToC', async () => {
		const user = userEvent.setup()
		const rootTopic = {
			...topic,
			id: 1,
			title: 'Mathematics',
			parent_id: null,
			parent_title: null
		}
		const childTopic = {
			...topic,
			id: 2,
			title: 'Algebra',
			parent_id: 1,
			parent_title: 'Mathematics'
		}
		const grandchildTopic = {
			...topic,
			id: 3,
			title: 'Linear Algebra',
			parent_id: 2,
			parent_title: 'Algebra'
		}

		useTopicMock.mockImplementation((topicId: number | null) => {
			if (topicId === 1) {
				return { data: rootTopic, isLoading: false, error: null }
			}

			return { data: null, isLoading: false, error: null }
		})
		useTopicsMock.mockImplementation(
			(params?: { subtree_of?: number; sort?: string; order?: string }) => {
				if (params?.sort === 'title' && params?.order === 'asc') {
					return {
						data:
							params?.subtree_of === 1
								? [rootTopic, childTopic, grandchildTopic]
								: [rootTopic, childTopic, grandchildTopic],
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
				topicId={1}
			/>
		)

		const toc = screen.getByRole('navigation', { name: 'On this page' })

		expect(within(toc).getByText('Algebra')).toBeInTheDocument()
		expect(within(toc).getByText('Linear Algebra')).toBeInTheDocument()

		await user.click(
			within(toc).getByRole('button', { name: 'Collapse Algebra' })
		)

		expect(within(toc).queryByText('Linear Algebra')).not.toBeInTheDocument()

		await user.click(
			within(toc).getByRole('button', { name: 'Expand Algebra' })
		)

		expect(within(toc).getByText('Linear Algebra')).toBeInTheDocument()
	})
})
