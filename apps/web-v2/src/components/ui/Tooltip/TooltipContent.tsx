import { Tooltip } from '@base-ui/react/tooltip'
import * as stylex from '@stylexjs/stylex'

import { tooltipColors } from '~/styles/componentColors.stylex'
import { fontSizes, radii, spacing } from '~/styles/tokens.stylex'

export interface TooltipContentProps extends Omit<
	React.ComponentProps<typeof Tooltip.Popup>,
	'className' | 'style'
> {
	align?: React.ComponentProps<typeof Tooltip.Positioner>['align']
	alignOffset?: React.ComponentProps<typeof Tooltip.Positioner>['alignOffset']
	side?: React.ComponentProps<typeof Tooltip.Positioner>['side']
	sideOffset?: React.ComponentProps<typeof Tooltip.Positioner>['sideOffset']
}

const styles = stylex.create({
	positioner: { zIndex: 60 },
	popup: {
		paddingBlock: '6px',
		paddingInline: spacing.sm,

		borderRadius: radii.xs,
		backgroundColor: tooltipColors.popupBackground,
		boxShadow: `0 4px 12px ${tooltipColors.popupShadow}`,
		color: tooltipColors.popupForeground,
		fontSize: fontSizes.xs,
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
			default: '100ms',
			'@media (prefers-reduced-motion: reduce)': '0ms',
		},
		transitionProperty: 'opacity, transform',
		transitionTimingFunction: 'ease-out',
		whiteSpace: 'nowrap',
	},
})

export function TooltipContent({
	align = 'center',
	alignOffset,
	role = 'tooltip',
	side = 'bottom',
	sideOffset = 4,
	...props
}: TooltipContentProps) {
	return (
		<Tooltip.Portal>
			<Tooltip.Positioner
				align={align}
				alignOffset={alignOffset}
				side={side}
				sideOffset={sideOffset}
				{...stylex.props(styles.positioner)}
			>
				<Tooltip.Popup
					role={role}
					{...stylex.props(styles.popup)}
					{...props}
				/>
			</Tooltip.Positioner>
		</Tooltip.Portal>
	)
}
