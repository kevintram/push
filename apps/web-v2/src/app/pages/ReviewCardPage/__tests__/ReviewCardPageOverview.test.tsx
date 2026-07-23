import { fireEvent, render, screen } from '@testing-library/react'
import { act, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HideModeProvider } from '~/stores/HideMode'

import { ReviewCardPageOverview } from '../ReviewCardPageOverview'

function renderOverview() {
	return render(<ReviewCardPageOverview />, {
		wrapper: ({ children }: { children: ReactNode }) => (
			<HideModeProvider>{children}</HideModeProvider>
		),
	})
}

const updateReviewCard = vi.fn()
vi.mock('~/modules/reviews/api/updateReviewCard', () => ({
	useUpdateReviewCard: () => ({ mutate: updateReviewCard }),
}))
vi.mock('@tanstack/react-router', () => ({
	useParams: () => ({ reviewCardId: '3' }),
}))
vi.mock('@tanstack/react-query', () => ({
	queryOptions: <T,>(options: T) => options,
	useSuspenseQuery: () => ({ data: card }),
}))
vi.mock('~/modules/reviews/components/ReviewsSidebar', () => ({
	ReviewsSidebar: () => null,
}))
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
})
