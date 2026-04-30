import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
	createMockLocalStorage,
	createReviewAsyncMock,
	navigateMock,
	reviewCard,
	updateReviewCardAsyncMock,
	useReviewCardQueueMock
} from '~/testing/support/masonryPageTestSupport'

const mockLocalStorage = createMockLocalStorage()

vi.mock('~/app/pages/review-card-detail/ReviewCardDetailSurface', () => ({
	ReviewCardDetailSurface: ({
		onCompletedReviewCreated,
		reviewCardId
	}: {
		onCompletedReviewCreated?: () => void
		reviewCardId: number
	}) => (
		<div data-testid='review-card-detail-surface'>
			Card {reviewCardId}
			<button onClick={onCompletedReviewCreated} type='button'>
				Create menu review
			</button>
		</div>
	)
}))

function queueItem({
	actionDays,
	id,
	primaryText,
	type = 'practice'
}: {
	actionDays: number | null
	id: number
	primaryText: string
	type?: 'practice' | 'flashcard'
}) {
	return {
		queue_type: actionDays == null ? ('new' as const) : ('due' as const),
		card: {
			...reviewCard,
			id,
			primary_text: primaryText,
			type
		},
		review_id: null,
		scheduled_at:
			actionDays == null ? null : actionDays <= 0 ? '2026-03-05' : '2026-03-06',
		action_days: actionDays,
		days_until_due: actionDays,
		days_until_hazy: null
	}
}

function mockQueues({
	dueItems,
	newItems
}: {
	dueItems: Array<ReturnType<typeof queueItem>>
	newItems: Array<ReturnType<typeof queueItem>>
}) {
	useReviewCardQueueMock.mockImplementation(
		(params: { mode?: 'focus' | 'list' }) => {
			const currentItems = dueItems.filter(item => item.action_days! <= 0)
			const futureItems = dueItems.filter(item => item.action_days! > 0)
			const items =
				params.mode === 'list'
					? [...newItems, ...dueItems]
					: [...currentItems, ...newItems, ...futureItems]

			return {
				data: {
					items,
					as_of: '2026-03-05'
				},
				isLoading: false
			}
		}
	)
}

async function renderDueFocusPage(props: {
	done?: boolean
	filter: 'all' | 'practice' | 'flashcards'
	includeFuture?: boolean
	order: 'due-date' | 'random'
	reviewCardId?: number
	shuffle?: string
}) {
	const { DueFocusPage } = await import('~/app/pages/DueFocusPage')
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false }
		}
	})
	const prefetchQuerySpy = vi
		.spyOn(queryClient, 'prefetchQuery')
		.mockImplementation(() => Promise.resolve(undefined))
	render(
		<QueryClientProvider client={queryClient}>
			<DueFocusPage {...props} />
		</QueryClientProvider>
	)
	return { prefetchQuerySpy }
}

describe('DueFocusPage', () => {
	beforeEach(() => {
		mockLocalStorage.clear()
		vi.stubGlobal('localStorage', mockLocalStorage)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('redirects /due/focus to the first current workload item', async () => {
		mockQueues({
			newItems: [queueItem({ actionDays: null, id: 12, primaryText: 'New' })],
			dueItems: [queueItem({ actionDays: 0, id: 11, primaryText: 'Today' })]
		})

		await renderDueFocusPage({ filter: 'all', order: 'due-date' })

		await waitFor(() => {
			expect(navigateMock).toHaveBeenCalledWith({
				to: '/due/focus',
				search: {
					card: 11,
					filter: 'all',
					order: 'due-date',
					shuffle: undefined
				}
			})
		})
	})

	it('renders footer actions, records ratings, and moves forward', async () => {
		const user = userEvent.setup()
		createReviewAsyncMock.mockResolvedValue({ id: 99 })
		mockQueues({
			newItems: [queueItem({ actionDays: null, id: 12, primaryText: 'New' })],
			dueItems: [
				queueItem({ actionDays: 0, id: 11, primaryText: 'Today' }),
				queueItem({
					actionDays: 0,
					id: 13,
					primaryText: 'Flash',
					type: 'flashcard'
				})
			]
		})

		await renderDueFocusPage({
			filter: 'all',
			order: 'due-date',
			reviewCardId: 11
		})

		expect(screen.getByTestId('review-card-detail-surface')).toHaveTextContent(
			'Card 11'
		)
		expect(screen.getByRole('button', { name: 'Focus' })).toHaveAttribute(
			'aria-pressed',
			'true'
		)
		expect(screen.getByRole('button', { name: /^Miss$/iu })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /^Hard$/iu })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /^Good$/iu })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /^Easy$/iu })).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Previous review card' })
		).toBeDisabled()

		await user.click(screen.getByRole('button', { name: /^Good$/iu }))

		await waitFor(() => {
			expect(createReviewAsyncMock).toHaveBeenCalledWith({
				review_card_id: 11,
				rating: 'good',
				completed_at: expect.any(String)
			})
		})
		expect(navigateMock).toHaveBeenCalledWith({
			to: '/due/focus',
			search: {
				card: 13,
				filter: 'all',
				order: 'due-date',
				shuffle: undefined
			}
		})
	})

	it('uses the focus toggle to return to the due list', async () => {
		const user = userEvent.setup()
		mockQueues({
			newItems: [],
			dueItems: [queueItem({ actionDays: 0, id: 11, primaryText: 'Today' })]
		})

		await renderDueFocusPage({
			filter: 'practice',
			order: 'due-date',
			reviewCardId: 11
		})

		await user.click(screen.getByRole('button', { name: 'Focus' }))

		expect(navigateMock).toHaveBeenCalledWith({
			to: '/due',
			search: { filter: 'practice' }
		})
	})

	it('shows the done state after rating the final stream item', async () => {
		const user = userEvent.setup()
		createReviewAsyncMock.mockResolvedValue({ id: 99 })
		mockQueues({
			newItems: [],
			dueItems: [queueItem({ actionDays: 0, id: 11, primaryText: 'Today' })]
		})

		await renderDueFocusPage({
			filter: 'all',
			order: 'due-date',
			reviewCardId: 11
		})

		await user.click(screen.getByRole('button', { name: /^Good$/iu }))

		await waitFor(() => {
			expect(createReviewAsyncMock).toHaveBeenCalledWith({
				review_card_id: 11,
				rating: 'good',
				completed_at: expect.any(String)
			})
		})
		expect(navigateMock).toHaveBeenCalledWith({
			to: '/due/focus',
			search: {
				done: true,
				filter: 'all',
				order: 'due-date',
				shuffle: undefined
			}
		})
	})

	it('advances after a completed review is created from the detail reviews menu', async () => {
		const user = userEvent.setup()
		mockQueues({
			newItems: [queueItem({ actionDays: null, id: 12, primaryText: 'New' })],
			dueItems: [queueItem({ actionDays: 0, id: 11, primaryText: 'Today' })]
		})

		await renderDueFocusPage({
			filter: 'all',
			order: 'due-date',
			reviewCardId: 11
		})

		await user.click(screen.getByRole('button', { name: 'Create menu review' }))

		expect(navigateMock).toHaveBeenCalledWith({
			to: '/due/focus',
			search: {
				card: 12,
				filter: 'all',
				order: 'due-date',
				shuffle: undefined
			}
		})
	})

	it('prefetches adjacent focus card details and reviews', async () => {
		mockQueues({
			newItems: [],
			dueItems: [
				queueItem({ actionDays: 0, id: 11, primaryText: 'Previous' }),
				queueItem({ actionDays: 0, id: 12, primaryText: 'Current' }),
				queueItem({ actionDays: 0, id: 13, primaryText: 'Next' })
			]
		})

		const { prefetchQuerySpy } = await renderDueFocusPage({
			filter: 'all',
			order: 'due-date',
			reviewCardId: 12
		})

		await waitFor(() => {
			expect(prefetchQuerySpy).toHaveBeenCalledWith(
				expect.objectContaining({
					queryKey: ['review-cards', 'detail', 11]
				})
			)
			expect(prefetchQuerySpy).toHaveBeenCalledWith(
				expect.objectContaining({
					queryKey: ['review-cards', 'detail', 13]
				})
			)
			expect(prefetchQuerySpy).toHaveBeenCalledWith(
				expect.objectContaining({
					queryKey: ['reviews', 'list', 'reviewCardId', '11']
				})
			)
			expect(prefetchQuerySpy).toHaveBeenCalledWith(
				expect.objectContaining({
					queryKey: ['reviews', 'list', 'reviewCardId', '13']
				})
			)
		})
	})

	it('shows the done state after retiring the final stream item', async () => {
		const user = userEvent.setup()
		updateReviewCardAsyncMock.mockResolvedValue({ id: 11 })
		mockQueues({
			newItems: [],
			dueItems: [queueItem({ actionDays: 0, id: 11, primaryText: 'Today' })]
		})

		await renderDueFocusPage({
			filter: 'practice',
			order: 'due-date',
			reviewCardId: 11
		})

		await user.click(screen.getByRole('button', { name: 'Retire this item' }))

		await waitFor(() => {
			expect(updateReviewCardAsyncMock).toHaveBeenCalledWith({
				id: 11,
				retired: true
			})
		})
		expect(navigateMock).toHaveBeenCalledWith({
			to: '/due/focus',
			search: {
				done: true,
				filter: 'practice',
				order: 'due-date',
				shuffle: undefined
			}
		})
	})

	it('seeds random order before redirecting to the first focus card', async () => {
		mockQueues({
			newItems: [queueItem({ actionDays: null, id: 12, primaryText: 'New' })],
			dueItems: [queueItem({ actionDays: 0, id: 11, primaryText: 'Today' })]
		})

		await renderDueFocusPage({ filter: 'all', order: 'random' })

		await waitFor(() => {
			expect(navigateMock).toHaveBeenCalledWith({
				to: '/due/focus',
				search: {
					filter: 'all',
					order: 'random',
					shuffle: expect.any(String)
				},
				replace: true
			})
		})
		expect(navigateMock).not.toHaveBeenCalledWith(
			expect.objectContaining({
				to: '/due/focus/$reviewCardId',
				search: {
					filter: 'all',
					order: 'random',
					shuffle: undefined
				}
			})
		)
	})

	it('restarts the focus stream when changing order from a focused card', async () => {
		const user = userEvent.setup()
		mockQueues({
			newItems: [queueItem({ actionDays: null, id: 12, primaryText: 'New' })],
			dueItems: [queueItem({ actionDays: 0, id: 11, primaryText: 'Today' })]
		})

		await renderDueFocusPage({
			filter: 'all',
			order: 'due-date',
			reviewCardId: 11
		})

		await user.click(screen.getByRole('button', { name: 'Order by: Due date' }))
		await user.click(screen.getByRole('menuitem', { name: 'Random' }))

		expect(navigateMock).toHaveBeenCalledWith({
			to: '/due/focus',
			search: {
				filter: 'all',
				order: 'random',
				shuffle: expect.any(String)
			}
		})
	})

	it('restarts the focus stream with a fresh seed when shuffling', async () => {
		const user = userEvent.setup()
		mockQueues({
			newItems: [queueItem({ actionDays: null, id: 12, primaryText: 'New' })],
			dueItems: [queueItem({ actionDays: 0, id: 11, primaryText: 'Today' })]
		})

		await renderDueFocusPage({
			filter: 'all',
			order: 'random',
			reviewCardId: 11,
			shuffle: 'old-seed'
		})

		await user.click(
			screen.getByRole('button', { name: 'Shuffle focus order' })
		)

		expect(navigateMock).toHaveBeenCalledWith({
			to: '/due/focus',
			search: {
				filter: 'all',
				order: 'random',
				shuffle: expect.not.stringMatching(/^old-seed$/u)
			}
		})
	})

	it('offers future review continuation from the caught-up empty state', async () => {
		const user = userEvent.setup()
		mockQueues({
			newItems: [],
			dueItems: [queueItem({ actionDays: 1, id: 14, primaryText: 'Tomorrow' })]
		})

		await renderDueFocusPage({ filter: 'practice', order: 'due-date' })

		expect(screen.getByText("You're all caught up!")).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Continue reviewing' }))

		expect(navigateMock).toHaveBeenCalledWith({
			to: '/due/focus',
			search: {
				card: 14,
				filter: 'practice',
				include_future: true,
				order: 'due-date',
				shuffle: undefined
			}
		})

		await user.click(screen.getByRole('button', { name: 'See upcoming' }))

		expect(navigateMock).toHaveBeenCalledWith({
			to: '/due',
			search: { filter: 'practice' }
		})
	})

	it('renders a done screen with future continuation actions', async () => {
		const user = userEvent.setup()
		mockQueues({
			newItems: [],
			dueItems: [queueItem({ actionDays: 1, id: 14, primaryText: 'Tomorrow' })]
		})

		await renderDueFocusPage({
			done: true,
			filter: 'practice',
			order: 'due-date'
		})

		expect(screen.getByText('Review complete')).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Review more' }))

		expect(navigateMock).toHaveBeenCalledWith({
			to: '/due/focus',
			search: {
				card: 14,
				filter: 'practice',
				include_future: true,
				order: 'due-date',
				shuffle: undefined
			}
		})
	})
})
