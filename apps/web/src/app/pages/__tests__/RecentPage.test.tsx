import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
	reviewCard,
	topic,
	useSearchAllMock,
} from '~/testing/support/masonryPageTestSupport'

import { RecentPage } from '../RecentPage'

describe('RecentPage', () => {
	it('renders grouped sections through masonry', () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date('2026-03-05T12:00:00.000Z'))
		useSearchAllMock.mockReturnValue({
			data: [
				{
					entityType: 'topic',
					topic,
					reviewCard: null,
					recentActivityAt: '2026-03-05T09:00:00.000Z',
				},
				{
					entityType: 'review_card',
					topic: null,
					reviewCard: {
						...reviewCard,
						id: 12,
						primaryText: 'Different prompt',
					},
					recentActivityAt: '2026-03-05T08:00:00.000Z',
				},
			],
			isLoading: false,
		})

		try {
			render(<RecentPage />)

			expect(screen.getByText('Today')).toBeInTheDocument()
			expect(screen.getByTestId('masonry-layout')).toBeInTheDocument()
			expect(screen.getAllByTestId('masonry-item')).toHaveLength(2)
			expect(screen.getByTestId('topic-card')).toHaveTextContent(
				'Algebra',
			)
			expect(screen.getByText('Different prompt')).toBeInTheDocument()
		} finally {
			vi.useRealTimers()
		}
	})
})
