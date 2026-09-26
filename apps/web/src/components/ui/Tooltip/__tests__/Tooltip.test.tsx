import { formatForDisplay } from '@tanstack/react-hotkeys'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Kbd } from '../..'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '..'

describe('Tooltip', () => {
	it('composes with a formatted keyboard shortcut child', async () => {
		const user = userEvent.setup()

		render(
			<TooltipProvider delay={0}>
				<Tooltip>
					<TooltipTrigger render={<button>Hide mode</button>} />
					<TooltipContent>
						Turn on hide mode
						<Kbd>{formatForDisplay('R')}</Kbd>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>,
		)

		await user.hover(screen.getByRole('button', { name: 'Hide mode' }))

		const tooltip = await screen.findByRole('tooltip')
		expect(tooltip).toHaveTextContent('Turn on hide mode')
		expect(tooltip.querySelector('kbd')).toHaveTextContent('R')
	})
})
