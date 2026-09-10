import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { CardTypeFilter } from '../cardTypeFilter'
import { CardTypeFilterBadges } from '../CardTypeFilterBadges'

function ControlledCardTypeFilterBadges({
	initialValue,
	onValueChange,
}: {
	initialValue: CardTypeFilter
	onValueChange: (value: CardTypeFilter) => void
}) {
	const [value, setValue] = useState(initialValue)

	return (
		<CardTypeFilterBadges
			value={value}
			onValueChange={next => {
				setValue(next)
				onValueChange(next)
			}}
		/>
	)
}

describe('CardTypeFilterBadges', () => {
	it('renders three radios in a radiogroup', () => {
		render(<CardTypeFilterBadges value='all' onValueChange={vi.fn()} />)

		expect(
			screen.getByRole('radiogroup', { name: 'Filter by card type' }),
		).toBeInTheDocument()
		expect(screen.getAllByRole('radio')).toHaveLength(3)
	})

	it('tracks aria-checked to the current value', () => {
		render(
			<CardTypeFilterBadges value='flashcard' onValueChange={vi.fn()} />,
		)

		expect(screen.getByRole('radio', { name: 'All' })).toHaveAttribute(
			'aria-checked',
			'false',
		)
		expect(
			screen.getByRole('radio', { name: 'Flashcards' }),
		).toHaveAttribute('aria-checked', 'true')
		expect(
			screen.getByRole('radio', { name: 'Not flashcards' }),
		).toHaveAttribute('aria-checked', 'false')
	})

	it('only the checked option has tabIndex 0', () => {
		render(
			<CardTypeFilterBadges value='flashcard' onValueChange={vi.fn()} />,
		)

		expect(screen.getByRole('radio', { name: 'All' })).toHaveAttribute(
			'tabindex',
			'-1',
		)
		expect(
			screen.getByRole('radio', { name: 'Flashcards' }),
		).toHaveAttribute('tabindex', '0')
		expect(
			screen.getByRole('radio', { name: 'Not flashcards' }),
		).toHaveAttribute('tabindex', '-1')
	})

	it('calls onValueChange with the clicked option', async () => {
		const user = userEvent.setup()
		const onValueChange = vi.fn()
		render(
			<CardTypeFilterBadges value='all' onValueChange={onValueChange} />,
		)

		await user.click(screen.getByRole('radio', { name: 'Flashcards' }))

		expect(onValueChange).toHaveBeenCalledWith('flashcard')
	})

	it('is a no-op when clicking the already-active option', async () => {
		const user = userEvent.setup()
		const onValueChange = vi.fn()
		render(
			<CardTypeFilterBadges value='all' onValueChange={onValueChange} />,
		)

		await user.click(screen.getByRole('radio', { name: 'All' }))

		expect(onValueChange).not.toHaveBeenCalled()
	})

	it('moves selection right and wraps with ArrowRight', async () => {
		const user = userEvent.setup()
		const onValueChange = vi.fn()
		render(
			<CardTypeFilterBadges
				value='not-flashcard'
				onValueChange={onValueChange}
			/>,
		)

		screen.getByRole('radio', { name: 'Not flashcards' }).focus()
		await user.keyboard('{ArrowRight}')

		expect(onValueChange).toHaveBeenCalledWith('all')
	})

	it('moves selection left and wraps with ArrowLeft', async () => {
		const user = userEvent.setup()
		const onValueChange = vi.fn()
		render(
			<CardTypeFilterBadges value='all' onValueChange={onValueChange} />,
		)

		screen.getByRole('radio', { name: 'All' }).focus()
		await user.keyboard('{ArrowLeft}')

		expect(onValueChange).toHaveBeenCalledWith('not-flashcard')
	})

	it('moves to the next option with ArrowDown and previous with ArrowUp', async () => {
		const user = userEvent.setup()
		const onValueChange = vi.fn()
		render(
			<ControlledCardTypeFilterBadges
				initialValue='flashcard'
				onValueChange={onValueChange}
			/>,
		)

		screen.getByRole('radio', { name: 'Flashcards' }).focus()
		await user.keyboard('{ArrowDown}')
		expect(onValueChange).toHaveBeenLastCalledWith('not-flashcard')

		await user.keyboard('{ArrowUp}')
		expect(onValueChange).toHaveBeenLastCalledWith('flashcard')
	})

	it('moves DOM focus onto the newly selected option', async () => {
		const user = userEvent.setup()
		render(
			<ControlledCardTypeFilterBadges
				initialValue='all'
				onValueChange={vi.fn()}
			/>,
		)

		screen.getByRole('radio', { name: 'All' }).focus()
		await user.keyboard('{ArrowRight}')

		expect(screen.getByRole('radio', { name: 'Flashcards' })).toHaveFocus()
	})
})
