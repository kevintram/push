import { fireEvent, render, screen } from '@testing-library/react'
import { act } from 'react'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TopicPage } from '../TopicPage'

const mutateAsync = vi.fn()
const createReviewCard = vi.fn()
let focusTopicTitle = false
vi.mock('~/modules/library/api/updateTopic', () => ({
	useUpdateTopic: () => ({ mutateAsync }),
}))
vi.mock('~/modules/library/api/deleteTopic', () => ({
	useDeleteTopic: () => ({ isPending: false, mutateAsync: vi.fn() }),
}))
vi.mock('~/modules/reviews/api/createReviewCard', () => ({
	useCreateReviewCard: () => ({
		isPending: false,
		mutateAsync: createReviewCard,
	}),
}))
vi.mock('@tanstack/react-router', () => ({
	useParams: () => ({ topicId: '1' }),
	useNavigate: () => vi.fn(),
	useLocation: ({ select }: { select: (location: object) => unknown }) =>
		select({ state: { focusTopicTitle } }),
}))
vi.mock('@tanstack/react-query', () => ({
	queryOptions: <T,>(options: T) => options,
	useQueryClient: () => ({ removeQueries: vi.fn() }),
	useQuery: ({ queryKey }: { queryKey: Array<string> }) => ({
		data: queryKey[0] === 'topics' ? topic : [],
	}),
}))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

const topic = { id: 1, title: 'Title', body: 'Body' }

describe('TopicPage editors', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		focusTopicTitle = false
		mutateAsync.mockReset().mockResolvedValue(topic)
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
		expect(mutateAsync).not.toHaveBeenCalled()
		await act(async () => vi.advanceTimersByTime(1000))
		expect(mutateAsync).toHaveBeenCalledWith({ id: 1, title: 'New title' })
	})

	it('flushes the body save on blur', async () => {
		render(<TopicPage />)
		const body = screen.getByLabelText('Topic body')
		fireEvent.change(body, { target: { value: 'New body' } })
		await act(async () => fireEvent.blur(body))
		expect(mutateAsync).toHaveBeenCalledWith({ id: 1, body: 'New body' })
	})

	it('keeps local text and reports failed saves', async () => {
		mutateAsync.mockRejectedValue(new Error('nope'))
		render(<TopicPage />)
		const title = screen.getByLabelText('Topic title')
		fireEvent.change(title, { target: { value: 'Unsaved' } })
		await act(async () => fireEvent.blur(title))
		expect(title).toHaveValue('Unsaved')
		expect(toast.error).toHaveBeenCalledWith('Failed to update topic title')
	})

	it('focuses the title after creating a topic', () => {
		focusTopicTitle = true
		render(<TopicPage />)

		expect(screen.getByLabelText('Topic title')).toHaveFocus()
	})
})
