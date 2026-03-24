import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
	masonryPropsSpy,
	renderTopicDetailPage,
	reviewCard,
	topic,
	useReviewCardsMock,
	useTopicMock,
	useTopicsMock
} from '~/testing/support/masonryPageTestSupport'

describe('TopicDetailPage masonry', () => {
	it('focuses the title textarea when landing on a newly created topic', async () => {
		useTopicMock.mockImplementation((topicId: number | null) => {
			if (topicId === 1) {
				return { data: topic, isLoading: false, error: null }
			}
			return { data: null, isLoading: false, error: null }
		})
		useTopicsMock.mockReturnValue({ data: [], isLoading: false })
		useReviewCardsMock.mockReturnValue({
			data: [{ ...reviewCard, id: 13, prompt: 'Topic detail card' }],
			isLoading: false
		})
		window.sessionStorage.setItem('topics:focus-new-topic-title', '1')

		render(renderTopicDetailPage({}))

		await waitFor(() => {
			expect(screen.getByRole('textbox', { name: 'Topic title' })).toHaveFocus()
		})
		expect(window.sessionStorage.getItem('topics:focus-new-topic-title')).toBe(
			null
		)
	})

	it('renders review cards through masonry without subtopic tabs', () => {
		useTopicMock.mockImplementation((topicId: number | null) => {
			if (topicId === 1) {
				return { data: topic, isLoading: false, error: null }
			}
			return { data: null, isLoading: false, error: null }
		})
		useTopicsMock.mockReturnValue({ data: [], isLoading: false })
		useReviewCardsMock.mockReturnValue({
			data: [{ ...reviewCard, id: 13, prompt: 'Topic detail card' }],
			isLoading: false
		})

		render(renderTopicDetailPage({}))

		expect(screen.getByTestId('masonry-layout')).toBeInTheDocument()
		expect(screen.getByText('Topic detail card')).toBeInTheDocument()
		expect(
			screen.queryByRole('tab', { name: /Subtopics/iu })
		).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: /^Add$/iu })).toBeInTheDocument()
		expect(
			masonryPropsSpy.mock.calls.some(
				([props]) =>
					props.items.length > 0 && typeof props.getScrollElement === 'function'
			)
		).toBe(true)
	})
})
