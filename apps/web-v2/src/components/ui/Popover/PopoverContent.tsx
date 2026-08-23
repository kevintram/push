import { Popover } from '@base-ui/react/popover'
import * as stylex from '@stylexjs/stylex'

import { popoverColors } from '~/styles/colors/components.stylex'
import { radii, spacing } from '~/styles/tokens.stylex'

export interface PopoverContentProps extends Omit<
	React.ComponentProps<typeof Popover.Popup>,
	'className' | 'style'
> {
	align?: React.ComponentProps<typeof Popover.Positioner>['align']
	alignOffset?: React.ComponentProps<typeof Popover.Positioner>['alignOffset']
	side?: React.ComponentProps<typeof Popover.Positioner>['side']
	sideOffset?: React.ComponentProps<typeof Popover.Positioner>['sideOffset']
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	positioner: { zIndex: 50 },
	popup: {
		padding: spacing.lg,

		borderColor: popoverColors.popupBorder,
		borderRadius: radii.lg,
		borderStyle: 'solid',
		borderWidth: '1px',
		outline: 'none',
		backgroundColor: popoverColors.popupBackground,
		boxShadow: `0 8px 24px ${popoverColors.popupShadow}`,
		color: popoverColors.popupForeground,
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
	side = 'bottom',
	sideOffset = 4,
	xstyle,
	...props
}: PopoverContentProps) {
	return (
		<Popover.Portal>
			<Popover.Positioner
				align={align}
				alignOffset={alignOffset}
				side={side}
				sideOffset={sideOffset}
				{...stylex.props(styles.positioner)}
			>
				<Popover.Popup
					{...stylex.props(styles.popup, xstyle)}
					{...props}
				/>
			</Popover.Positioner>
		</Popover.Portal>
	)
}
