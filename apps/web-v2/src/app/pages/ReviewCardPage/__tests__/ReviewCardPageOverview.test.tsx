import { fireEvent, render, screen } from '@testing-library/react'
import { act, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HideModeButton } from '~/components/HideModeButton'
import { HideModeProvider } from '~/stores/HideMode'

import { ReviewCardPageOverview } from '../ReviewCardPageOverview'

function renderOverview() {
	return render(<ReviewCardPageOverview />, {
		wrapper: ({ children }: { children: ReactNode }) => (
			<HideModeProvider>
				<HideModeButton />
				{children}
			</HideModeProvider>
		),
	})
}

const updateReviewCard = vi.fn()
vi.mock('~/modules/reviews/api/updateReviewCard', () => ({
	useUpdateReviewCard: () => ({ mutate: updateReviewCard }),
}))
vi.mock('~/modules/reviews/api/deleteReviewCard', () => ({
	useDeleteReviewCard: () => ({
		isPending: false,
		mutateAsync: vi.fn().mockResolvedValue(undefined),
	}),
}))
vi.mock('@tanstack/react-router', () => ({
	useParams: () => ({ reviewCardId: card.id }),
	useRouter: () => ({ history: { back: vi.fn() } }),
}))
vi.mock('@tanstack/react-query', () => ({
	queryOptions: <T,>(options: T) => options,
	useSuspenseQuery: () => ({ data: card }),
}))
vi.mock('~/modules/reviews/components/ReviewsSidebar', () => ({
	ReviewsSidebar: () => null,
}))
const initialCard = {
	id: '3',
	topic_id: '1',
	type: 'practice',
	primary_text: 'Question',
	secondary_text: 'Answer',
	notes: 'Notes',
	stability: null,
	last_reviewed_at: null,
	next_due_at: null,
	freshness_tier: null,
	flagged_at: null,
}
let card = { ...initialCard }

describe('ReviewCardPageOverview editors', () => {
	beforeEach(() => {
		sessionStorage.clear()
		card = { ...initialCard }
		vi.useFakeTimers()
		updateReviewCard.mockReset()
	})
	afterEach(() => {
		vi.clearAllTimers()
		vi.useRealTimers()
	})

	it.each([
		['Review-card primary text', 'primary_text'],
		['Review-card secondary text', 'secondary_text'],
		['Review-card notes', 'notes'],
	] as const)('saves %s with its API field', async (label, field) => {
		renderOverview()
		const editor = screen.getByLabelText(label)
		fireEvent.change(editor, { target: { value: 'Edited' } })
		await act(async () => fireEvent.blur(editor))
		expect(updateReviewCard).toHaveBeenCalledWith({
			id: '3',
			[field]: 'Edited',
		})
	})

	it('debounces persistence while updating text immediately', async () => {
		renderOverview()
		const editor = screen.getByLabelText('Review-card primary text')
		fireEvent.change(editor, { target: { value: 'Edited' } })
		expect(editor).toHaveValue('Edited')
		expect(updateReviewCard).not.toHaveBeenCalled()
		await act(async () => vi.advanceTimersByTime(1000))
		expect(updateReviewCard).toHaveBeenCalledWith({
			id: '3',
			primary_text: 'Edited',
		})
	})

	it('flushes pending edits when the page unmounts', async () => {
		const { unmount } = renderOverview()
		fireEvent.change(screen.getByLabelText('Review-card notes'), {
			target: { value: 'Pending notes' },
		})
		await act(async () => unmount())
		expect(updateReviewCard).toHaveBeenCalledWith({
			id: '3',
			notes: 'Pending notes',
		})
	})

	it('keeps local text visible while dispatching the save', async () => {
		renderOverview()
		const notes = screen.getByLabelText('Review-card notes')
		fireEvent.change(notes, { target: { value: 'Unsaved notes' } })
		await act(async () => fireEvent.blur(notes))
		expect(notes).toHaveValue('Unsaved notes')
		expect(updateReviewCard).toHaveBeenCalledWith({
			id: '3',
			notes: 'Unsaved notes',
		})
	})

	it('keeps practice secondary text revealed in hide mode', () => {
		sessionStorage.setItem('hideMode', 'on')
		renderOverview()

		expect(screen.getAllByRole('button', { name: 'Reveal' })).toHaveLength(
			1,
		)
	})

	it('covers flashcard secondary text in hide mode', () => {
		sessionStorage.setItem('hideMode', 'on')
		card = { ...card, type: 'flashcard' }
		renderOverview()

		expect(screen.getAllByRole('button', { name: 'Reveal' })).toHaveLength(
			2,
		)
	})

	it('reveals the answer and notes independently', () => {
		sessionStorage.setItem('hideMode', 'on')
		card = { ...card, type: 'flashcard' }
		renderOverview()

		const [answerReveal] = screen.getAllByRole('button', { name: 'Reveal' })
		fireEvent.click(answerReveal!)
		expect(screen.getAllByRole('button', { name: 'Reveal' })).toHaveLength(
			1,
		)

		fireEvent.click(screen.getByRole('button', { name: 'Reveal' }))
		expect(
			screen.queryByRole('button', { name: 'Reveal' }),
		).not.toBeInTheDocument()
	})

	it('covers the answer when the card changes to a flashcard', () => {
		sessionStorage.setItem('hideMode', 'on')
		const { rerender } = renderOverview()

		card = { ...card, type: 'flashcard' }
		rerender(<ReviewCardPageOverview />)

		expect(screen.getAllByRole('button', { name: 'Reveal' })).toHaveLength(
			2,
		)
	})

	it('resets both manual reveals when the review-card ID changes', () => {
		sessionStorage.setItem('hideMode', 'on')
		card = { ...card, type: 'flashcard' }
		const { rerender } = renderOverview()
		for (const reveal of screen.getAllByRole('button', {
			name: 'Reveal',
		})) {
			fireEvent.click(reveal)
		}

		card = { ...card, id: '4' }
		rerender(<ReviewCardPageOverview />)

		expect(screen.getAllByRole('button', { name: 'Reveal' })).toHaveLength(
			2,
		)
	})

	it('resets both manual reveals when hide mode changes', () => {
		sessionStorage.setItem('hideMode', 'on')
		card = { ...card, type: 'flashcard' }
		renderOverview()
		for (const reveal of screen.getAllByRole('button', {
			name: 'Reveal',
		})) {
			fireEvent.click(reveal)
		}

		fireEvent.click(screen.getByRole('button', { name: 'Hide Mode' }))
		fireEvent.click(screen.getByRole('button', { name: 'Hide Mode' }))

		expect(screen.getAllByRole('button', { name: 'Reveal' })).toHaveLength(
			2,
		)
	})

	it('auto-saves a covered textarea after it is revealed', async () => {
		sessionStorage.setItem('hideMode', 'on')
		card = { ...card, type: 'flashcard' }
		renderOverview()
		fireEvent.click(screen.getAllByRole('button', { name: 'Reveal' })[0]!)
		const editor = screen.getByLabelText('Review-card secondary text')

		fireEvent.change(editor, { target: { value: 'Revealed edit' } })
		await act(async () => fireEvent.blur(editor))

		expect(updateReviewCard).toHaveBeenCalledWith({
			id: '3',
			secondary_text: 'Revealed edit',
		})
	})
})
