import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '~/components/ui'

import type { Card, CardSrsState } from '../../types/review.types'
import { CardItem } from '../CardItem'
import { CardList } from '../CardList'

const navigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
	Link: ({
		children,
		params,
		...props
	}: ComponentProps<'a'> & {
		params?: { cardId: string }
		to?: string
	}) => (
		<a href={`/cards/${params?.cardId}`} {...props}>
			{children}
		</a>
	),
	useNavigate: () => navigate,
}))

vi.mock('../CardActions', () => ({
	CardActions: () => null,
}))

const card = {
	_id: 'card-1',
	primaryText: 'What problem do generics solve?',
	secondaryText: 'Reusable, type-safe code',
	type: 'practice',
} as unknown as Card

const reviewed: CardSrsState = {
	lastReviewedAt: '2026-08-01',
	lastRating: 'good',
	nextDueAt: '2026-08-10',
	retrievability: 0.85,
	stability: 10.4,
}

const unreviewed: CardSrsState = {
	lastReviewedAt: null,
	lastRating: null,
	nextDueAt: null,
	retrievability: null,
	stability: null,
}

function renderList(
	srs: CardSrsState,
	props: Partial<ComponentProps<typeof CardItem>> = {},
) {
	return render(
		<TooltipProvider delay={0}>
			<CardList title='Cards'>
				<CardItem card={card} srs={srs} today='2026-08-09' {...props} />
			</CardList>
		</TooltipProvider>,
	)
}

describe('CardList', () => {
	it('names its columns', () => {
		renderList(reviewed)

		expect(
			screen.getAllByRole('columnheader').map(cell => cell.textContent),
		).toEqual(['Cards', 'Due', 'Last reviewed', 'Strength', 'Actions'])
	})

	it('heads its title at the given level', () => {
		render(
			<CardList title='Cell membrane' headingLevel={3}>
				{null}
			</CardList>,
		)

		expect(
			screen.getByRole('heading', { level: 3, name: 'Cell membrane' }),
		).toBeInTheDocument()
	})

	it('links a card to its page and leaves out the practice answer', () => {
		renderList(reviewed)

		expect(
			screen.getByRole('link', {
				name: 'What problem do generics solve?',
			}),
		).toHaveAttribute('href', '/cards/card-1')
		expect(
			screen.queryByText('Reusable, type-safe code'),
		).not.toBeInTheDocument()
	})

	it('shows the whole title in a tooltip on hover', async () => {
		const user = userEvent.setup()
		renderList(reviewed)

		await user.hover(screen.getByText('What problem do generics solve?'))

		expect(await screen.findByRole('tooltip')).toHaveTextContent(
			'What problem do generics solve?',
		)
	})

	it('shows the due date for both layouts', () => {
		renderList(reviewed)

		expect(screen.getByText('Due Tomorrow')).toBeInTheDocument()
		expect(screen.getByText('Tomorrow')).toBeInTheDocument()
		expect(
			document.querySelector('svg.lucide-calendar'),
		).toBeInTheDocument()
	})

	it('shows the last rating and when it was given', () => {
		renderList(reviewed)

		expect(
			screen.getByLabelText('Good, reviewed Aug 1, 2026'),
		).toHaveTextContent('Aug 1')
		expect(document.querySelector('svg.lucide-check')).toBeInTheDocument()
	})

	it('marks a new card as never reviewed', async () => {
		const user = userEvent.setup()
		renderList(unreviewed)

		// The table's dash, named for screen readers.
		expect(screen.getByText('Never')).toBeInTheDocument()
		await user.hover(screen.getByText('New'))

		expect(await screen.findByRole('tooltip')).toHaveTextContent(
			'Not reviewed yet',
		)
	})

	it('marks a new card by its title', async () => {
		const user = userEvent.setup()
		renderList(unreviewed)

		const link = screen.getByRole('link', {
			name: 'What problem do generics solve?',
		})
		await user.hover(link.querySelector('svg.lucide-sparkles')!)

		expect(await screen.findByRole('tooltip')).toHaveTextContent(
			'Not reviewed yet',
		)
	})

	it('selects a card from its title or its metadata', async () => {
		const user = userEvent.setup()
		const onClick = vi.fn()
		renderList(reviewed, {
			onClick,
			buttonProps: { 'aria-label': 'Select card' },
		})

		await user.click(screen.getByRole('button', { name: 'Select card' }))
		await user.click(screen.getByText('Due Tomorrow'))

		expect(onClick).toHaveBeenCalledTimes(2)
	})

	it('opens a linked card from its metadata', async () => {
		const user = userEvent.setup()
		renderList(reviewed)

		await user.click(screen.getByText('Due Tomorrow'))

		expect(navigate).toHaveBeenCalledWith({
			to: '/cards/$cardId',
			params: { cardId: 'card-1' },
		})
	})
})
