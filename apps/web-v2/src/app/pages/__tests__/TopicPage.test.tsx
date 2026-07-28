import { fireEvent, render, screen } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TopicPage } from '../TopicPage'

const updateTopic = vi.fn()
const createReviewCard = vi.fn()
const navigate = vi.fn()
let focusTopicTitle = false
const deleteTopic = vi.fn()
let isCreatingReviewCard = false
let createReviewCardVariables: { topicId: string } | undefined
let currentHref = '/library/1'
vi.mock('~/modules/library/api/updateTopic', () => ({
	useUpdateTopic: () => ({ mutate: updateTopic }),
}))
vi.mock('~/modules/library/api/deleteTopic', () => ({
	useDeleteTopic: () => ({ isPending: false, mutate: deleteTopic }),
}))
vi.mock('~/modules/reviews/api/createReviewCard', () => ({
	useCreateReviewCard: () => ({
		isPending: isCreatingReviewCard,
		mutate: createReviewCard,
		variables: createReviewCardVariables,
	}),
}))
vi.mock('@tanstack/react-router', () => ({
	useParams: () => ({ topicId: '1' }),
	useNavigate: () => navigate,
	useLocation: ({ select }: { select: (location: object) => unknown }) =>
		select({ state: { focusTopicTitle } }),
	useRouter: () => ({
		state: { location: { href: currentHref } },
	}),
}))
vi.mock('@tanstack/react-query', () => ({
	queryOptions: <T,>(options: T) => options,
	useSuspenseQuery: ({ queryKey }: { queryKey: Array<string> }) => ({
		data: queryKey[0] === 'topics' ? topic : [],
	}),
}))
const topic = { id: '1', title: 'Title', body: 'Body' }

describe('TopicPage editors', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		focusTopicTitle = false
		isCreatingReviewCard = false
		createReviewCardVariables = undefined
		currentHref = '/library/1'
		updateTopic.mockReset()
		createReviewCard.mockReset()
		deleteTopic.mockReset()
		navigate.mockReset()
	})
	afterEach(() => {
		vi.clearAllTimers()
		vi.useRealTimers()
	})

	it('updates immediately and saves only the title after the debounce', async () => {
		render(<TopicPage />)
		const title = screen.getByLabelText('Topic title')
		fireEvent.change(title, { target: { value: 'New title' } })
		expect(title).toHaveValue('New title')
		expect(updateTopic).not.toHaveBeenCalled()
		await act(async () => vi.advanceTimersByTime(1000))
		expect(updateTopic).toHaveBeenCalledWith({
			id: '1',
			title: 'New title',
		})
	})

	it('flushes the body save on blur', async () => {
		render(<TopicPage />)
		const body = screen.getByLabelText('Topic body')
		fireEvent.change(body, { target: { value: 'New body' } })
		await act(async () => fireEvent.blur(body))
		expect(updateTopic).toHaveBeenCalledWith({ id: '1', body: 'New body' })
	})

	it('keeps local text while dispatching the save', async () => {
		render(<TopicPage />)
		const title = screen.getByLabelText('Topic title')
		fireEvent.change(title, { target: { value: 'Unsaved' } })
		await act(async () => fireEvent.blur(title))
		expect(title).toHaveValue('Unsaved')
		expect(updateTopic).toHaveBeenCalledWith({ id: '1', title: 'Unsaved' })
	})

	it('focuses the title after creating a topic', () => {
		focusTopicTitle = true
		render(<TopicPage />)

		expect(screen.getByLabelText('Topic title')).toHaveFocus()
	})

	it('shows a noninteractive pending review-card row', () => {
		isCreatingReviewCard = true
		createReviewCardVariables = { topicId: '1' }

		render(<TopicPage />)

		expect(screen.getByText('Creating review card…')).toHaveAttribute(
			'aria-disabled',
			'true',
		)
		expect(
			screen.getByRole('button', { name: 'Add review card' }),
		).toBeDisabled()
	})

	it('navigates with the real review-card ID only from the source route', () => {
		createReviewCard.mockImplementation((_input, options) => {
			options.onSuccess({ id: '43' })
		})
		render(<TopicPage />)

		screen.getByRole('button', { name: 'Add review card' }).click()

		expect(navigate).toHaveBeenCalledWith({
			to: '/review-cards/$reviewCardId',
			params: { reviewCardId: '43' },
		})
	})
})
