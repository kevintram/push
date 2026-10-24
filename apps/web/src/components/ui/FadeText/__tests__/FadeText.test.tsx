import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { TooltipProvider } from '../../Tooltip'
import { FadeText } from '..'

describe('FadeText', () => {
	it('shows the whole text in a tooltip on hover', async () => {
		const user = userEvent.setup()

		render(
			<TooltipProvider delay={0}>
				<FadeText>Spanish irregular preterite verbs</FadeText>
			</TooltipProvider>,
		)

		await user.hover(screen.getByText('Spanish irregular preterite verbs'))

		expect(await screen.findByRole('tooltip')).toHaveTextContent(
			'Spanish irregular preterite verbs',
		)
	})
})
