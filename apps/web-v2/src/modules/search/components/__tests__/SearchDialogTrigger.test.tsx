import { formatForDisplay } from '@tanstack/react-hotkeys'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { TooltipProvider } from '~/components/ui'

import { SEARCH_HOTKEY } from '../../searchHotkey'
import { SearchDialogTrigger } from '../SearchDialogTrigger'

describe('SearchDialogTrigger', () => {
	it('shows the search shortcut in its tooltip', async () => {
		const user = userEvent.setup()

		render(
			<TooltipProvider delay={0}>
				<SearchDialogTrigger />
			</TooltipProvider>,
		)

		await user.hover(screen.getByRole('button', { name: 'Search' }))

		const tooltip = await screen.findByRole('tooltip')
		expect(tooltip).toHaveTextContent('Search')
		expect(tooltip.querySelector('kbd')).toHaveTextContent(
			formatForDisplay(SEARCH_HOTKEY),
		)
	})
})
