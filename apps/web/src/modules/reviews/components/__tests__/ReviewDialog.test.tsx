import type { Id } from '@convex/_generated/dataModel'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Dialog } from '~/components/ui'
import type { DateString } from '~/types/date'

import type { Review } from '../../types/review.types'
import { ReviewDialog } from '../ReviewDialog'

vi.mock('@tanstack/react-query', () => ({
	useQuery: () => ({ data: undefined }),
}))

vi.mock('~/modules/library/api/collectionQueries', () => ({
	collectionQueries: {
		detail: () => ({
			queryKey: ['collection'],
			queryFn: async () => undefined,
		}),
	},
}))

vi.mock('~/modules/reviews/api/cardQueries', () => ({
	cardQueries: {
		detail: () => ({
			queryKey: ['card'],
			queryFn: async () => undefined,
		}),
	},
}))

vi.mock('../RatingPicker', () => ({
	RatingPicker: () => <button type='button'>Rating</button>,
}))

vi.mock('../ReviewDatePicker', () => ({
	ReviewDatePicker: () => (
		<button aria-label='Review date' type='button'>
			Date
		</button>
	),
}))

vi.mock('../ReviewDialogBreadcrumbs', () => ({
	ReviewDialogBreadcrumbs: () => <nav>Breadcrumbs</nav>,
}))

vi.mock('../ReviewDurability', () => ({
	ReviewDurability: () => <span>Durability</span>,
}))

const review = {
	_creationTime: 0,
	_id: 'review-1' as Id<'reviews'>,
	date: '2026-08-25',
	description: 'A description',
	notes: 'Some notes',
	ownerId: 'user-1',
	rating: 'good',
	cardId: 'card-1' as Id<'cards'>,
	stabilityAfter: 15,
} as Review

function ReviewDialogHarness({ onDelete }: { onDelete: () => void }) {
	const [isOpen, setIsOpen] = useState(true)
	const descriptionField = {
		flush: vi.fn(),
		onChange: vi.fn(),
		setValue: vi.fn(),
		value: review.description,
	}
	const notesField = {
		flush: vi.fn(),
		onChange: vi.fn(),
		setValue: vi.fn(),
		value: review.notes,
	}

	return (
		<>
			<button onClick={() => setIsOpen(true)} type='button'>
				Open review
			</button>
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<ReviewDialog
					descriptionField={descriptionField}
					isOpen={isOpen}
					notesField={notesField}
					onDelete={onDelete}
					onSetDate={vi.fn<(value: DateString | null) => void>()}
					onSetRating={vi.fn()}
					review={review}
				/>
			</Dialog>
		</>
	)
}

describe('ReviewDialog', () => {
	it('toggles the same mounted editor and keeps focus on the window control', async () => {
		const user = userEvent.setup()

		render(<ReviewDialogHarness onDelete={vi.fn()} />)

		const description = screen.getByRole('textbox', {
			name: 'Review description',
		})
		const notes = screen.getByRole('textbox', { name: 'Review notes' })
		const expand = screen.getByRole('button', { name: 'Expand review' })

		expect(expand).toHaveAttribute('aria-expanded', 'false')
		await user.click(expand)

		expect(
			screen.getByRole('button', { name: 'Collapse review' }),
		).toHaveFocus()
		expect(
			screen.getByRole('button', { name: 'Collapse review' }),
		).toHaveAttribute('aria-expanded', 'true')
		expect(
			screen.getByRole('textbox', { name: 'Review description' }),
		).toBe(description)
		expect(screen.getByRole('textbox', { name: 'Review notes' })).toBe(
			notes,
		)
	})

	it('keeps delete in the footer actions menu', async () => {
		const user = userEvent.setup()
		const onDelete = vi.fn()

		render(<ReviewDialogHarness onDelete={onDelete} />)

		await user.click(screen.getByRole('button', { name: 'Review actions' }))
		await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

		expect(onDelete).toHaveBeenCalledOnce()
	})

	it('resets expansion after close and reopen', async () => {
		const user = userEvent.setup()

		render(<ReviewDialogHarness onDelete={vi.fn()} />)

		await user.click(screen.getByRole('button', { name: 'Expand review' }))
		await user.click(screen.getByRole('button', { name: 'Close review' }))

		await user.click(screen.getByRole('button', { name: 'Open review' }))

		expect(
			screen.getByRole('button', { name: 'Expand review' }),
		).toHaveAttribute('aria-expanded', 'false')
	})
})
