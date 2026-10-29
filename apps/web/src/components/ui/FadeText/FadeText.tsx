import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { textFade } from '~/styles/textFade'

import type { TooltipContentProps } from '../Tooltip'
import { Tooltip, TooltipContent, TooltipTrigger } from '../Tooltip'

const styles = stylex.create({
	// Long text wraps instead of running off the screen.
	tooltip: {
		maxInlineSize: 'min(480px, 90vw)',
		overflowWrap: 'anywhere',
		whiteSpace: 'normal',
	},
})

export interface FadeTextProps {
	children: ReactNode
	align?: TooltipContentProps['align']
	side?: TooltipContentProps['side']
	xstyle?: stylex.StyleXStyles
}

/**
 * One line of `textFade` text. Hovering it shows the whole text in a tooltip,
 * so text cut short by the fade can still be read.
 */
export function FadeText({
	children,
	align,
	side = 'inline-end',
	xstyle,
}: FadeTextProps) {
	return (
		<Tooltip>
			<TooltipTrigger
				render={<span {...stylex.props(textFade.line, xstyle)} />}
			>
				{children}
			</TooltipTrigger>
			<TooltipContent align={align} side={side} xstyle={styles.tooltip}>
				{children}
			</TooltipContent>
		</Tooltip>
	)
}
