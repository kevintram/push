import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ReviewCardPageReviews } from '../ReviewCardPageReviews'

const createReview = vi.fn()
let isCreating = false
let variables: { reviewCardId: string } | undefined

vi.mock('@tanstack/react-query', () => ({
	queryOptions: <T,>(options: T) => options,
	useSuspenseQuery: () => ({ data: [] }),
}))
vi.mock('@tanstack/react-router', () => ({
	useParams: () => ({ reviewCardId: '8' }),
}))
vi.mock('~/modules/reviews/api/createReview', () => ({
	useCreateReview: () => ({
		isPending: isCreating,
		mutate: createReview,
		variables,
	}),
}))
vi.mock('~/modules/reviews/components/Review', () => ({
	Review: () => null,
}))

describe('ReviewCardPageReviews', () => {
	beforeEach(() => {
		createReview.mockReset()
		isCreating = false
		variables = undefined
	})

	it('renders submitted create state as a disabled pending row', () => {
		isCreating = true
		variables = { reviewCardId: '8' }

		render(<ReviewCardPageReviews />)

		expect(screen.getByText('Creating review…')).toHaveAttribute(
			'aria-disabled',
			'true',
		)
		expect(screen.getByRole('button', { name: 'Review' })).toBeDisabled()
		expect(screen.queryByText('No reviews yet.')).not.toBeInTheDocument()
	})
})
