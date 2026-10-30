import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import { Sparkles } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { iconSizes } from '~/styles/tokens.stylex'

const styles = stylex.create({
	trigger: {
		display: 'inline-flex',
		flexShrink: 0,
	},
	icon: {
		blockSize: iconSizes.sm,
		color: colorsSemantic.textSecondary,
		display: 'block',
		inlineSize: iconSizes.sm,
	},
})

type CardNewIndicatorProps = {
	xstyle?: StyleXStyles
}

/** Marks a card that has not been reviewed yet. */
export function CardNewIndicator({ xstyle }: CardNewIndicatorProps) {
	return (
		<Tooltip>
			<TooltipTrigger
				render={<span {...stylex.props(styles.trigger, xstyle)} />}
			>
				<Sparkles aria-label='New' {...stylex.props(styles.icon)} />
			</TooltipTrigger>
			<TooltipContent>Not reviewed yet</TooltipContent>
		</Tooltip>
	)
}
