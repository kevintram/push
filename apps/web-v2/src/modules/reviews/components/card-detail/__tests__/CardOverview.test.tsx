import type { Id } from '@convex/_generated/dataModel'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HideModeProvider } from '../../../hide-mode/HideModeProvider'
import { useHideMode } from '../../../hide-mode/useHideMode'
import { CardOverview } from '../CardOverview'

const updateCardMutateAsync = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-query', () => ({
	useSuspenseQuery: ({ queryKey }: { queryKey: Array<string> }) => ({
		data: cardsById[queryKey[1]!],
	}),
}))
vi.mock('../../../api/cardQueries', () => ({
	cardQueries: {
		detail: (cardId: string) => ({ queryKey: ['card', cardId] }),
	},
	useUpdateCard: () => ({ mutateAsync: updateCardMutateAsync }),
}))
vi.mock('../../../utils/cardSrs', () => ({ deriveCardSrsState: () => ({}) }))
vi.mock('../../CardMetadata', () => ({ CardMetadata: () => null }))

const firstCard = 'card-1' as Id<'cards'>

let cardsById: Record<string, unknown> = {}

function baseCard(overrides: Partial<Record<string, unknown>> = {}) {
	return {
		type: 'flashcard',
		primaryText: 'Prompt',
		secondaryText: '',
		notes: '',
		...overrides,
	}
}

/** Exposes the hide mode toggle so tests can cross a reset point in place. */
function HideModeToggle() {
	const { toggleHideMode } = useHideMode()

	return (
		<button onClick={toggleHideMode} type='button'>
			Toggle hide mode
		</button>
	)
}

function renderOverview(cardId: Id<'cards'> = firstCard) {
	return render(
		<HideModeProvider>
			<HideModeToggle />
			<CardOverview cardId={cardId} />
		</HideModeProvider>,
	)
}

function toggleHideMode() {
	fireEvent.click(screen.getByRole('button', { name: 'Toggle hide mode' }))
}

function secondaryTextbox() {
	return screen.getByRole('textbox', { name: 'Card secondary text' })
}

function notesTextbox() {
	return screen.getByRole('textbox', { name: 'Card notes' })
}

function queryVisibleSecondaryTextbox() {
	return screen.queryByRole('textbox', { name: 'Card secondary text' })
}

function queryVisibleNotesTextbox() {
	return screen.queryByRole('textbox', { name: 'Card notes' })
}

function revealButtons() {
	return screen.queryAllByRole('button', { name: 'Reveal' })
}

describe('CardOverview reveal-on-empty', () => {
	beforeEach(() => {
		sessionStorage.setItem('hideMode', 'on')
		updateCardMutateAsync.mockReset()
		cardsById = { [firstCard]: baseCard() }
	})

	it('reveals an empty secondary text and empty notes with hide mode on', () => {
		renderOverview()

		expect(revealButtons()).toHaveLength(0)
		expect(secondaryTextbox()).toBeInTheDocument()
		expect(notesTextbox()).toBeInTheDocument()
	})

	it('hides non-empty secondary text and notes behind a Reveal button', () => {
		cardsById[firstCard] = baseCard({
			secondaryText: 'An answer',
			notes: 'Some notes',
		})

		renderOverview()

		expect(revealButtons()).toHaveLength(2)
		expect(queryVisibleSecondaryTextbox()).not.toBeInTheDocument()
		expect(queryVisibleNotesTextbox()).not.toBeInTheDocument()
	})

	it('treats whitespace-only text as empty', () => {
		cardsById[firstCard] = baseCard({
			secondaryText: '   ',
			notes: '\n\t ',
		})

		renderOverview()

		expect(revealButtons()).toHaveLength(0)
		expect(secondaryTextbox()).toBeInTheDocument()
		expect(notesTextbox()).toBeInTheDocument()
	})

	it('keeps a field revealed because it was empty after typing into it', () => {
		renderOverview()

		fireEvent.change(secondaryTextbox(), {
			target: { value: 'Now has content' },
		})
		fireEvent.change(notesTextbox(), {
			target: { value: 'Now has notes' },
		})

		expect(revealButtons()).toHaveLength(0)
		expect(secondaryTextbox()).toHaveValue('Now has content')
		expect(notesTextbox()).toHaveValue('Now has notes')
	})

	it('re-evaluates emptiness when hide mode is turned on', () => {
		sessionStorage.setItem('hideMode', 'off')
		cardsById[firstCard] = baseCard({
			secondaryText: 'An answer',
			notes: '',
		})

		renderOverview()
		expect(revealButtons()).toHaveLength(0)

		toggleHideMode()

		expect(revealButtons()).toHaveLength(1)
		expect(queryVisibleSecondaryTextbox()).not.toBeInTheDocument()
		expect(notesTextbox()).toBeInTheDocument()
	})

	it('does not reveal a hidden field emptied by a remote update', () => {
		cardsById[firstCard] = baseCard({
			secondaryText: 'An answer',
			notes: 'Some notes',
		})

		const { rerender } = renderOverview()
		expect(revealButtons()).toHaveLength(2)

		cardsById[firstCard] = baseCard()
		rerender(
			<HideModeProvider>
				<HideModeToggle />
				<CardOverview cardId={firstCard} />
			</HideModeProvider>,
		)

		expect(revealButtons()).toHaveLength(2)
	})
})
