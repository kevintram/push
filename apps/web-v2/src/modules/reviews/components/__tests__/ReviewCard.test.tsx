import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HideModeButton } from '~/components/HideModeButton'
import { HideModeProvider } from '~/stores/HideMode'
import type { DateString } from '~/types/date'
import { formatRelativeDate } from '~/utils/date'

import type { ReviewCard as ReviewCardModel } from '../../types/review.types'
import { ReviewCard } from '../ReviewCard'

const renderCard = (ui: React.ReactElement) =>
	render(ui, {
		wrapper: ({ children }) => (
			<HideModeProvider>
				<HideModeButton />
				{children}
			</HideModeProvider>
		),
	})

const updateReviewCard = vi.fn()
const deleteReviewCard = vi.fn()
const linkClick = vi.fn()

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
	}) => (
		<a {...props} onClick={linkClick}>
			{children}
		</a>
	),
}))
vi.mock('../../api/updateReviewCard', () => ({
	useUpdateReviewCard: () => ({ mutate: updateReviewCard }),
}))
vi.mock('../../api/deleteReviewCard', () => ({
	useDeleteReviewCard: () => ({
		isPending: false,
		mutate: deleteReviewCard,
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
		sessionStorage.clear()
		updateReviewCard.mockReset()
		deleteReviewCard.mockReset().mockResolvedValue(undefined)
		linkClick.mockReset()
	})

	it('reveals a practice answer when hide mode is on', () => {
		sessionStorage.setItem('hideMode', 'on')
		renderCard(<ReviewCard {...card} />)

		expect(
			screen.queryByRole('button', { name: 'Reveal' }),
		).not.toBeInTheDocument()
	})

	it('reveals a flashcard answer when hide mode is off', () => {
		renderCard(<ReviewCard {...card} type='flashcard' />)

		expect(
			screen.queryByRole('button', { name: 'Reveal' }),
		).not.toBeInTheDocument()
	})

	it('covers a flashcard answer when hide mode is on', () => {
		sessionStorage.setItem('hideMode', 'on')
		renderCard(<ReviewCard {...card} type='flashcard' />)

		expect(
			screen.getByRole('button', { name: 'Reveal' }),
		).toBeInTheDocument()
	})

	it('reveals only the clicked flashcard answer', async () => {
		sessionStorage.setItem('hideMode', 'on')
		const user = userEvent.setup()
		renderCard(
			<>
				<ReviewCard {...card} id='3' type='flashcard' />
				<ReviewCard {...card} id='4' type='flashcard' />
			</>,
		)

		await user.click(screen.getAllByRole('button', { name: 'Reveal' })[0]!)

		expect(screen.getAllByRole('button', { name: 'Reveal' })).toHaveLength(
			1,
		)
	})

	it('covers an answer after changing from practice to flashcard', () => {
		sessionStorage.setItem('hideMode', 'on')
		const { rerender } = renderCard(<ReviewCard {...card} />)

		rerender(<ReviewCard {...card} type='flashcard' />)

		expect(
			screen.getByRole('button', { name: 'Reveal' }),
		).toBeInTheDocument()
	})

	it('reveals without activating the stretched detail link', async () => {
		sessionStorage.setItem('hideMode', 'on')
		const user = userEvent.setup()
		renderCard(<ReviewCard {...card} type='flashcard' />)

		await user.click(screen.getByRole('button', { name: 'Reveal' }))

		expect(linkClick).not.toHaveBeenCalled()
		expect(
			screen.queryByRole('button', { name: 'Reveal' }),
		).not.toBeInTheDocument()
	})

	it('resets a manual reveal when hide mode changes', async () => {
		sessionStorage.setItem('hideMode', 'on')
		const user = userEvent.setup()
		renderCard(<ReviewCard {...card} type='flashcard' />)
		await user.click(screen.getByRole('button', { name: 'Reveal' }))

		await user.click(screen.getByRole('button', { name: 'Hide Mode' }))
		await user.click(screen.getByRole('button', { name: 'Hide Mode' }))

		expect(
			screen.getByRole('button', { name: 'Reveal' }),
		).toBeInTheDocument()
	})

	it('turns a practice card into a flashcard from the overflow menu', async () => {
		const user = userEvent.setup()
		renderCard(<ReviewCard {...card} />)

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
		renderCard(<ReviewCard {...card} type='flashcard' />)

		await user.click(screen.getByRole('button', { name: 'Unflashcard' }))

		expect(updateReviewCard).toHaveBeenCalledWith({
			id: '3',
			type: 'practice',
		})
	})

	it('unflashcards a flashcard from the overflow menu', async () => {
		const user = userEvent.setup()
		renderCard(<ReviewCard {...card} type='flashcard' />)

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
		renderCard(<ReviewCard {...card} />)

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
		renderCard(<ReviewCard {...card} flagged_at='2026-07-15T00:00:00Z' />)

		await user.click(screen.getByRole('button', { name: 'Unflag' }))

		expect(updateReviewCard).toHaveBeenCalledWith({
			id: '3',
			flagged: false,
		})
	})

	it('unflags a flagged card from the overflow menu', async () => {
		const user = userEvent.setup()
		renderCard(<ReviewCard {...card} flagged_at='2026-07-15T00:00:00Z' />)

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
		renderCard(<ReviewCard {...card} />)

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
		renderCard(<ReviewCard {...card} />)

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
		renderCard(
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
