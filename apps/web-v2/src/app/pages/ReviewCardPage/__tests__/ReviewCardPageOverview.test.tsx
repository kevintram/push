import { fireEvent, render, screen } from '@testing-library/react'
import { act } from 'react'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ReviewCardPageOverview } from '../ReviewCardPageOverview'

const mutateAsync = vi.fn()
vi.mock('~/modules/reviews/api/updateReviewCard', () => ({
	useUpdateReviewCard: () => ({ mutateAsync }),
}))
vi.mock('@tanstack/react-router', () => ({
	useParams: () => ({ reviewCardId: '3' }),
}))
vi.mock('@tanstack/react-query', () => ({
	queryOptions: <T,>(options: T) => options,
	useQuery: () => ({ data: card }),
}))
vi.mock('~/modules/reviews/components/ReviewsSidebar', () => ({
	ReviewsSidebar: () => null,
}))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

const card = {
	id: '3',
	topic_id: '1',
	primary_text: 'Question',
	secondary_text: 'Answer',
	notes: 'Notes',
}

describe('ReviewCardPageOverview editors', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		mutateAsync.mockReset().mockResolvedValue(card)
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
		render(<ReviewCardPageOverview />)
		const editor = screen.getByLabelText(label)
		fireEvent.change(editor, { target: { value: 'Edited' } })
		await act(async () => fireEvent.blur(editor))
		expect(mutateAsync).toHaveBeenCalledWith({
			id: '3',
			[field]: 'Edited',
		})
	})

	it('debounces persistence while updating text immediately', async () => {
		render(<ReviewCardPageOverview />)
		const editor = screen.getByLabelText('Review-card primary text')
		fireEvent.change(editor, { target: { value: 'Edited' } })
		expect(editor).toHaveValue('Edited')
		expect(mutateAsync).not.toHaveBeenCalled()
		await act(async () => vi.advanceTimersByTime(1000))
		expect(mutateAsync).toHaveBeenCalledWith({
			id: '3',
			primary_text: 'Edited',
		})
	})

	it('flushes pending edits when the page unmounts', async () => {
		const { unmount } = render(<ReviewCardPageOverview />)
		fireEvent.change(screen.getByLabelText('Review-card notes'), {
			target: { value: 'Pending notes' },
		})
		await act(async () => unmount())
		expect(mutateAsync).toHaveBeenCalledWith({
			id: '3',
			notes: 'Pending notes',
		})
	})

	it('keeps failed text visible and displays a field-specific toast', async () => {
		mutateAsync.mockRejectedValue(new Error('nope'))
		render(<ReviewCardPageOverview />)
		const notes = screen.getByLabelText('Review-card notes')
		fireEvent.change(notes, { target: { value: 'Unsaved notes' } })
		await act(async () => fireEvent.blur(notes))
		expect(notes).toHaveValue('Unsaved notes')
		expect(toast.error).toHaveBeenCalledWith(
			'Failed to update review-card notes',
		)
	})
})
