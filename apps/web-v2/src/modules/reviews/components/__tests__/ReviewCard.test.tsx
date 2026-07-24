import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DateString } from '~/types/date'
import { formatRelativeDate } from '~/utils/date'

import type { ReviewCard as ReviewCardModel } from '../../types/review.types'
import { ReviewCard } from '../ReviewCard'

const updateReviewCard = vi.fn()
const deleteReviewCard = vi.fn()

vi.mock('@tanstack/react-router', () => ({
	Link: ({
		to: _to,
		params: _params,
		children,
		...props
	}: {
		to?: string
		params?: unknown
		children?: React.ReactNode
	}) => <a {...props}>{children}</a>,
}))
vi.mock('../../api/updateReviewCard', () => ({
	useUpdateReviewCard: () => ({ mutate: updateReviewCard }),
}))
vi.mock('../../api/deleteReviewCard', () => ({
	useDeleteReviewCard: () => ({
		isPending: false,
		mutateAsync: deleteReviewCard,
	}),
}))

const card: ReviewCardModel = {
	id: '3',
	topic_id: '1',
	type: 'practice',
	primary_text: 'Question',
	secondary_text: 'Answer',
	notes: '',
	stability: 16.2,
	last_reviewed_at: '2026-07-15',
	next_due_at: '2026-07-31',
	freshness_tier: 'Hazy',
	flagged_at: null,
}

describe('ReviewCard', () => {
	beforeEach(() => {
		updateReviewCard.mockReset()
		deleteReviewCard.mockReset().mockResolvedValue(undefined)
	})

	it('turns a practice card into a flashcard from the overflow menu', async () => {
		const user = userEvent.setup()
		render(<ReviewCard {...card} />)

		await user.click(
			screen.getByRole('button', { name: 'Review card actions' }),
		)
		await user.click(screen.getByRole('menuitem', { name: 'Flashcard' }))

		expect(updateReviewCard).toHaveBeenCalledWith({
			id: '3',
			type: 'flashcard',
		})
	})

	it('unflashcards a flashcard from its footer button', async () => {
		const user = userEvent.setup()
		render(<ReviewCard {...card} type='flashcard' />)

		await user.click(screen.getByRole('button', { name: 'Unflashcard' }))

		expect(updateReviewCard).toHaveBeenCalledWith({
			id: '3',
			type: 'practice',
		})
	})

	it('unflashcards a flashcard from the overflow menu', async () => {
		const user = userEvent.setup()
		render(<ReviewCard {...card} type='flashcard' />)

		await user.click(
			screen.getByRole('button', { name: 'Review card actions' }),
		)
		await user.click(screen.getByRole('menuitem', { name: 'Unflashcard' }))

		expect(updateReviewCard).toHaveBeenCalledWith({
			id: '3',
			type: 'practice',
		})
	})

	it('flags an unflagged card', async () => {
		const user = userEvent.setup()
		render(<ReviewCard {...card} />)

		await user.click(
			screen.getByRole('button', { name: 'Review card actions' }),
		)
		await user.click(screen.getByRole('menuitem', { name: 'Flag' }))

		expect(updateReviewCard).toHaveBeenCalledWith({
			id: '3',
			flagged: true,
		})
	})

	it('unflags a flagged card from its footer button', async () => {
		const user = userEvent.setup()
		render(<ReviewCard {...card} flagged_at='2026-07-15T00:00:00Z' />)

		await user.click(screen.getByRole('button', { name: 'Unflag' }))

		expect(updateReviewCard).toHaveBeenCalledWith({
			id: '3',
			flagged: false,
		})
	})

	it('unflags a flagged card from the overflow menu', async () => {
		const user = userEvent.setup()
		render(<ReviewCard {...card} flagged_at='2026-07-15T00:00:00Z' />)

		await user.click(
			screen.getByRole('button', { name: 'Review card actions' }),
		)
		await user.click(screen.getByRole('menuitem', { name: 'Unflag' }))

		expect(updateReviewCard).toHaveBeenCalledWith({
			id: '3',
			flagged: false,
		})
	})

	it('requires confirmation before deleting', async () => {
		const user = userEvent.setup()
		render(<ReviewCard {...card} />)

		await user.click(
			screen.getByRole('button', { name: 'Review card actions' }),
		)
		await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

		expect(deleteReviewCard).not.toHaveBeenCalled()
		expect(
			screen.getByRole('heading', { name: 'Delete review card?' }),
		).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Delete' }))

		expect(deleteReviewCard).toHaveBeenCalledWith('3')
	})

	it('renders metadata chips from real fields', () => {
		render(<ReviewCard {...card} />)

		expect(screen.getByText('Hazy')).toBeInTheDocument()
		expect(screen.getByText('Durable for 16d')).toBeInTheDocument()
		expect(
			screen.getByText(formatRelativeDate('2026-07-15' as DateString)),
		).toBeInTheDocument()
		expect(
			screen.getByText(
				`Due ${formatRelativeDate('2026-07-31' as DateString)}`,
			),
		).toBeInTheDocument()
		expect(screen.queryByText('Unreviewed')).not.toBeInTheDocument()
	})

	it('shows a single Unreviewed chip for new cards', () => {
		render(
			<ReviewCard
				{...card}
				stability={null}
				last_reviewed_at={null}
				next_due_at={null}
				freshness_tier={null}
			/>,
		)

		expect(screen.getByText('Unreviewed')).toBeInTheDocument()
		expect(screen.queryByText('Hazy')).not.toBeInTheDocument()
		expect(screen.queryByText(/Durable/)).not.toBeInTheDocument()
	})
})
