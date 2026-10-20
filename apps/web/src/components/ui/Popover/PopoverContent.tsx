import { Popover } from '@base-ui/react/popover'
import * as stylex from '@stylexjs/stylex'

import { semanticColors } from '~/styles/colors/semantic.stylex'
import { radii, spacing } from '~/styles/tokens.stylex'

export interface PopoverContentProps extends Omit<
	React.ComponentProps<typeof Popover.Popup>,
	'className' | 'style'
> {
	align?: React.ComponentProps<typeof Popover.Positioner>['align']
	alignOffset?: React.ComponentProps<typeof Popover.Positioner>['alignOffset']
	collisionAvoidance?: React.ComponentProps<
		typeof Popover.Positioner
	>['collisionAvoidance']
	side?: React.ComponentProps<typeof Popover.Positioner>['side']
	sideOffset?: React.ComponentProps<typeof Popover.Positioner>['sideOffset']
	/** Semantic color overrides. The popup portals out of themed ancestors. */
	theme?: stylex.Theme<typeof semanticColors>
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	positioner: { zIndex: 50 },
	popup: {
		padding: spacing.lg,

		borderColor: semanticColors.borderPrimary,
		borderRadius: radii.lg,
		borderStyle: 'solid',
		borderWidth: '1px',
		outline: 'none',
		backgroundColor: semanticColors.surfaceRaised,
		boxShadow: `0 8px 24px ${semanticColors.shadowPrimary}`,
		color: semanticColors.textPrimary,
		opacity: {
			default: 1,
			':is([data-starting-style], [data-ending-style])': 0,
		},
		transform: {
			default: 'scale(1)',
			':is([data-starting-style], [data-ending-style])': 'scale(0.96)',
		},
		transformOrigin: 'var(--transform-origin)',
		transitionDuration: {
			default: '120ms',
			'@media (prefers-reduced-motion: reduce)': '0ms',
		},
		transitionProperty: 'opacity, transform',
		transitionTimingFunction: 'ease-out',
	},
})

export function PopoverContent({
	align = 'center',
	alignOffset,
	collisionAvoidance,
	side = 'bottom',
	sideOffset = 4,
	theme,
	xstyle,
	...props
}: PopoverContentProps) {
	return (
		<Popover.Portal>
			<Popover.Positioner
				align={align}
				alignOffset={alignOffset}
				collisionAvoidance={collisionAvoidance}
				side={side}
				sideOffset={sideOffset}
				{...stylex.props(styles.positioner)}
			>
				<Popover.Popup
					{...stylex.props(theme, styles.popup, xstyle)}
					{...props}
				/>
			</Popover.Positioner>
		</Popover.Portal>
	)
}
