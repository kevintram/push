import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { textFade } from '~/styles/textFade'

import { Tooltip, TooltipContent, TooltipTrigger } from '../Tooltip'

export interface FadeTextProps {
	children: ReactNode
	xstyle?: stylex.StyleXStyles
}

/**
 * One line of `textFade` text. Hovering it shows the whole text in a tooltip,
 * so text cut short by the fade can still be read.
 */
export function FadeText({ children, xstyle }: FadeTextProps) {
	return (
		<Tooltip>
			<TooltipTrigger
				render={<span {...stylex.props(textFade.line, xstyle)} />}
			>
				{children}
			</TooltipTrigger>
			<TooltipContent side='inline-end'>{children}</TooltipContent>
		</Tooltip>
	)
}
