import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import {
	createTopicAsyncMock,
	masonryRenderSpy,
	navigateMock,
	topic,
	useTopicsMock
} from '~/testing/support/masonryPageTestSupport'
import { TopicsPage } from '../TopicsPage'

describe('TopicsPage', () => {
	it('renders MyLibrary topics through masonry', () => {
		useTopicsMock.mockImplementation(
			(params?: { root?: boolean; sort?: string; order?: string }) => {
				if (params?.root === true) {
					return {
						data: [topic],
						isLoading: false
					}
				}

				if (params?.sort === 'title' && params?.order === 'asc') {
					return {
						data: [
							topic,
							{ ...topic, id: 2, title: 'Linear equations', parent_id: 1 }
						],
						isLoading: false
					}
				}

				return { data: [], isLoading: false }
			}
		)

		render(<TopicsPage />)

		expect(screen.getByTestId('masonry-layout')).toBeInTheDocument()
		expect(screen.getByTestId('topic-card')).toHaveTextContent('Algebra')
		expect(masonryRenderSpy).toHaveBeenCalledWith([topic])
	})

	it('creates a blank root topic and navigates to it from the topics page', async () => {
		const user = userEvent.setup()
		useTopicsMock.mockReturnValue({
			data: [],
			isLoading: false
		})
		createTopicAsyncMock.mockResolvedValue({
			id: 42
		})

		render(<TopicsPage />)

		const [createButton] = screen.getAllByRole('button', { name: /^Create$/iu })

		expect(createButton).toBeDefined()
		if (!createButton) {
			throw new Error('Expected a create button to be rendered')
		}

		await user.click(createButton)

		expect(createTopicAsyncMock).toHaveBeenCalledWith({
			title: '',
			body: '',
			parent_id: null
		})
		expect(navigateMock).toHaveBeenCalledWith({
			to: '/topics/$topicId',
			params: { topicId: '42' },
			search: { focusTitle: true }
		})
	})
})
