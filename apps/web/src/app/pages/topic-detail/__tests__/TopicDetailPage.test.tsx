import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import {
	elementSizeMock,
	navigateMock,
	parentTopic,
	topic,
	useReviewCardsMock,
	useTopicMock,
	useTopicsMock
} from '~/testing/support/detailPageTestSupport'
import { TopicDetailPage } from '../TopicDetailPage'

type TopicFixture = Omit<typeof topic, 'parent_id' | 'parent_title'> & {
	parent_id: number | null
	parent_title: string | null
}

function buildTopicChain(titles: Array<string>): Array<TopicFixture> {
	return titles.map((title, index) => ({
		...topic,
		id: index + 1,
		title,
		parent_id: index === 0 ? null : index,
		parent_title: index === 0 ? null : (titles[index - 1] ?? null)
	}))
}

function setupTopicChainMocks(chain: Array<TopicFixture>, currentId: number) {
	useTopicMock.mockImplementation((topicId: number | null) => {
		if (topicId === currentId) {
			return {
				data: chain.find(t => t.id === currentId) ?? null,
				isLoading: false,
				error: null
			}
		}

		return { data: null, isLoading: false, error: null }
	})
	useTopicsMock.mockImplementation(
		(params?: { parent_id?: number; sort?: string; order?: string }) => {
			if (params?.sort === 'title' && params?.order === 'asc') {
				return { data: chain, isLoading: false }
			}

			return { data: [], isLoading: false }
		}
	)
}

describe('TopicDetailPage', () => {
	afterEach(() => {
		elementSizeMock.width = 1024
	})

	it('renders a read-only breadcrumb path from root to current topic', () => {
		const chain = buildTopicChain([
			'Mathematics',
			'Algebra',
			'Linear equations'
		])
		setupTopicChainMocks(chain, 3)

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

	it('preserves the root topic when collapsing on narrow screens', async () => {
		elementSizeMock.width = 200

		const chain = buildTopicChain([
			'Mathematics',
			'Algebra',
			'Linear systems',
			'Gaussian elimination'
		])
		setupTopicChainMocks(chain, 4)

		render(
			<TopicDetailPage
				cardTypeFilter='all'
				onCardTypeFilterChange={() => {}}
				topicId={4}
			/>
		)

		const breadcrumb = screen.getByRole('navigation', { name: 'Topic path' })

		await waitFor(() => {
			expect(
				within(breadcrumb).getByRole('link', { name: 'Mathematics' })
			).toBeInTheDocument()
		})

		expect(
			within(breadcrumb).queryByRole('link', { name: 'Algebra' })
		).not.toBeInTheDocument()
		expect(
			within(breadcrumb).queryByRole('link', { name: 'Linear systems' })
		).not.toBeInTheDocument()
		expect(
			within(breadcrumb).getByText('Gaussian elimination')
		).toBeInTheDocument()
		expect(
			within(breadcrumb).getByRole('button', { name: 'Show hidden topics' })
		).toBeInTheDocument()
		expect(
			within(breadcrumb).getByRole('button', { name: 'Algebra' })
		).toBeInTheDocument()
		expect(
			within(breadcrumb).getByRole('button', { name: 'Linear systems' })
		).toBeInTheDocument()
		expect(
			breadcrumb.querySelector('[data-slot="breadcrumb-ellipsis"]')
		).toBeInTheDocument()

		await userEvent.click(
			within(breadcrumb).getByRole('button', { name: 'Linear systems' })
		)

		expect(navigateMock).toHaveBeenCalledWith({
			params: { topicId: '3' },
			to: '/topics/$topicId'
		})
	})

	it('keeps the immediate parent visible when collapsing deep breadcrumb paths on wider screens', async () => {
		elementSizeMock.width = 400

		const chain = buildTopicChain([
			'Mathematics',
			'Algebra',
			'Systems of equations',
			'Row reduction',
			'Gaussian elimination'
		])
		setupTopicChainMocks(chain, 5)

		render(
			<TopicDetailPage
				cardTypeFilter='all'
				onCardTypeFilterChange={() => {}}
				topicId={5}
			/>
		)

		const breadcrumb = screen.getByRole('navigation', { name: 'Topic path' })

		await waitFor(() => {
			expect(
				within(breadcrumb).getByRole('link', { name: 'Row reduction' })
			).toBeInTheDocument()
		})

		expect(
			within(breadcrumb).getByRole('link', { name: 'Mathematics' })
		).toBeInTheDocument()
		expect(
			within(breadcrumb).queryByRole('link', { name: 'Algebra' })
		).not.toBeInTheDocument()
		expect(
			within(breadcrumb).queryByRole('link', {
				name: 'Systems of equations'
			})
		).not.toBeInTheDocument()
		expect(
			within(breadcrumb).getByText('Gaussian elimination')
		).toBeInTheDocument()
		expect(
			breadcrumb.querySelector('[data-slot="breadcrumb-ellipsis"]')
		).toBeInTheDocument()
	})

	it('keeps moderately deep breadcrumb paths fully expanded on large screens', async () => {
		elementSizeMock.width = 600

		const chain = buildTopicChain([
			'Mathematics',
			'Algebra',
			'Systems of equations',
			'Row reduction',
			'Matrix rank',
			'Rank-nullity theorem'
		])
		setupTopicChainMocks(chain, 6)

		render(
			<TopicDetailPage
				cardTypeFilter='all'
				onCardTypeFilterChange={() => {}}
				topicId={6}
			/>
		)

		const breadcrumb = screen.getByRole('navigation', { name: 'Topic path' })

		await waitFor(() => {
			expect(
				within(breadcrumb).getByRole('link', { name: 'Mathematics' })
			).toBeInTheDocument()
		})

		expect(
			within(breadcrumb).getByRole('link', { name: 'Algebra' })
		).toBeInTheDocument()
		expect(
			within(breadcrumb).getByRole('link', { name: 'Systems of equations' })
		).toBeInTheDocument()
		expect(
			within(breadcrumb).getByRole('link', { name: 'Row reduction' })
		).toBeInTheDocument()
		expect(
			within(breadcrumb).getByRole('link', { name: 'Matrix rank' })
		).toBeInTheDocument()
		expect(
			within(breadcrumb).getByText('Rank-nullity theorem')
		).toBeInTheDocument()
		expect(
			breadcrumb.querySelector('[data-slot="breadcrumb-ellipsis"]')
		).toBeNull()
	})

	it('hides the breadcrumb when the current topic has no ancestors', () => {
		const rootTopic = {
			...topic,
			id: 1,
			title: 'Mathematics',
			parent_id: null,
			parent_title: null
		}

		useTopicMock.mockImplementation((topicId: number | null) => {
			if (topicId === 1) {
				return { data: rootTopic, isLoading: false, error: null }
			}

			return { data: null, isLoading: false, error: null }
		})
		useTopicsMock.mockImplementation(
			(params?: { parent_id?: number; sort?: string; order?: string }) => {
				if (params?.sort === 'title' && params?.order === 'asc') {
					return {
						data: [rootTopic],
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

		expect(
			screen.queryByRole('navigation', { name: 'Topic path' })
		).not.toBeInTheDocument()
	})

	it('renders the document while review cards continue loading in the background', () => {
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
						data: [rootTopic, childTopic],
						isLoading: false
					}
				}

				if (params?.sort === 'title' && params?.order === 'asc') {
					return {
						data: [rootTopic, childTopic],
						isLoading: false
					}
				}

				return { data: [], isLoading: false }
			}
		)
		useReviewCardsMock.mockReturnValue({ data: [], isLoading: true })

		render(
			<TopicDetailPage
				cardTypeFilter='all'
				onCardTypeFilterChange={() => {}}
				topicId={1}
			/>
		)

		expect(screen.getByDisplayValue('Mathematics')).toBeInTheDocument()
		expect(screen.getAllByText('Loading review cards').length).toBeGreaterThan(
			0
		)
		expect(
			screen.queryByText('No review cards in this filter')
		).not.toBeInTheDocument()
	})

	it('renders an error when the subtree topics request fails', () => {
		const subtreeError = new Error('subtree failed')

		useTopicsMock.mockImplementation(
			(params?: { subtree_of?: number; sort?: string; order?: string }) => {
				if (
					params?.subtree_of === 1 &&
					params.sort === 'title' &&
					params.order === 'asc'
				) {
					return {
						data: [],
						error: subtreeError,
						isLoading: false
					}
				}

				if (params?.sort === 'title' && params?.order === 'asc') {
					return {
						data: [topic],
						error: null,
						isLoading: false
					}
				}

				return { data: [], error: null, isLoading: false }
			}
		)

		render(
			<TopicDetailPage
				cardTypeFilter='all'
				onCardTypeFilterChange={() => {}}
				topicId={1}
			/>
		)

		expect(screen.getByText('subtree failed')).toBeInTheDocument()
		expect(screen.queryByDisplayValue('Algebra')).not.toBeInTheDocument()
	})

	it('renders an error when the review cards request fails', () => {
		const reviewCardsError = new Error('review cards failed')

		useTopicsMock.mockImplementation(
			(params?: { subtree_of?: number; sort?: string; order?: string }) => {
				if (params?.sort === 'title' && params?.order === 'asc') {
					return {
						data: [topic],
						error: null,
						isLoading: false
					}
				}

				return { data: [], error: null, isLoading: false }
			}
		)
		useReviewCardsMock.mockReturnValue({
			data: [],
			error: reviewCardsError,
			isLoading: false
		})

		render(
			<TopicDetailPage
				cardTypeFilter='all'
				onCardTypeFilterChange={() => {}}
				topicId={1}
			/>
		)

		expect(screen.getByText('review cards failed')).toBeInTheDocument()
		expect(
			screen.queryByText('No review cards in this filter')
		).not.toBeInTheDocument()
	})

	it('does not render native hash anchor ids for topic sections', () => {
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
						data: [rootTopic, childTopic],
						isLoading: false
					}
				}

				if (params?.sort === 'title' && params?.order === 'asc') {
					return {
						data: [rootTopic, childTopic],
						isLoading: false
					}
				}

				return { data: [], isLoading: false }
			}
		)

		const { container } = render(
			<TopicDetailPage
				cardTypeFilter='all'
				onCardTypeFilterChange={() => {}}
				topicId={1}
			/>
		)

		expect(container.querySelector('#topic-1')).toBeNull()
		expect(container.querySelector('#topic-2')).toBeNull()
		expect(
			container.querySelector('[data-topic-detail-heading-id="1"]')
		).not.toBeNull()
		expect(
			container.querySelector('[data-topic-detail-heading-id="2"]')
		).not.toBeNull()
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

	it('renders the ToC from the current document subtree including the root topic', () => {
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

		expect(within(toc).getByRole('link', { name: 'Mathematics' })).toHaveClass(
			'font-bold'
		)
		expect(
			within(toc).getByRole('link', { name: 'Mathematics' }).parentElement
		).not.toHaveClass('bg-accent/45')
		expect(within(toc).getByText('Algebra')).toBeInTheDocument()
		expect(within(toc).getByText('Linear Algebra')).toBeInTheDocument()
		expect(within(toc).queryByText('Computer Science')).not.toBeInTheDocument()
	})

	it('renders the root as a flat, non-collapsible ToC row', async () => {
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
		const rootRow = within(toc).getByRole('link', { name: 'Mathematics' })
		const childRow = within(toc).getByRole('link', { name: 'Algebra' })

		expect(rootRow).toBeInTheDocument()
		expect(
			within(toc).queryByRole('button', { name: 'Collapse Mathematics' })
		).not.toBeInTheDocument()
		expect(
			within(toc).queryByRole('button', {
				name: 'More actions for Mathematics'
			})
		).not.toBeInTheDocument()
		expect(rootRow.closest('li')?.parentElement).toBe(
			childRow.closest('li')?.parentElement
		)
		expect(
			screen.getByRole('button', { name: 'Collapse Algebra' })
		).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Collapse Algebra' }))

		expect(screen.getByRole('button', { name: 'Expand Algebra' })).toHaveClass(
			'text-blue-600'
		)
		expect(screen.queryByText('Leaf topic body')).not.toBeInTheDocument()
	})

	it('renders hover-only open and more controls while keeping the chevron visible for nested subtopics', () => {
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

		const openButton = screen.getByRole('button', { name: 'Open Algebra' })
		const moreActionsButton = screen.getByRole('button', {
			name: 'More actions for Algebra'
		})
		const collapseButton = screen.getByRole('button', {
			name: 'Collapse Algebra'
		})
		const hoverControls = openButton.parentElement
		const controls = hoverControls?.parentElement

		expect(hoverControls).toHaveClass('opacity-0')
		expect(hoverControls).toHaveClass('group-hover/section:opacity-100')
		expect(hoverControls).toHaveClass(
			'group-has-[:focus-visible]/section:opacity-100'
		)
		expect(collapseButton).not.toHaveClass('opacity-0')
		expect(controls).toContainElement(collapseButton)
		expect(controls).toContainElement(openButton)
		expect(controls).toContainElement(moreActionsButton)
	})

	it('does not duplicate the open action in a nested subtopic more menu', () => {
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

		expect(
			screen.getByRole('button', { name: 'Open Algebra' })
		).toBeInTheDocument()

		const algebraMenuButton = screen.getByRole('button', {
			name: 'More actions for Algebra'
		})
		const algebraMenu = algebraMenuButton.parentElement

		expect(algebraMenu).not.toBeNull()
		expect(
			within(algebraMenu!).queryByRole('button', { name: 'Open' })
		).toBeNull()
		expect(
			within(algebraMenu!).getByRole('button', { name: 'New topic' })
		).toBeInTheDocument()
		expect(
			within(algebraMenu!).getByRole('button', { name: 'Delete' })
		).toBeInTheDocument()
	})

	it('does not show a visible more-actions button for the ToC root row', () => {
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
								? [rootTopic, childTopic]
								: [rootTopic, childTopic],
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

		expect(
			within(toc).queryByRole('button', {
				name: 'More actions for Mathematics'
			})
		).not.toBeInTheDocument()
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

		expect(
			within(toc).queryByRole('button', { name: 'Collapse Mathematics' })
		).not.toBeInTheDocument()
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
