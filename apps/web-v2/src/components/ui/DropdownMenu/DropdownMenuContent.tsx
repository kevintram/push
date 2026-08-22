import { Menu } from '@base-ui/react/menu'
import * as stylex from '@stylexjs/stylex'

import { dropdownMenuColors } from '~/styles/componentColors.stylex'
import { radii, spacing } from '~/styles/tokens.stylex'

export interface DropdownMenuContentProps extends Omit<
	React.ComponentProps<typeof Menu.Popup>,
	'className' | 'style'
> {
	align?: React.ComponentProps<typeof Menu.Positioner>['align']
	alignOffset?: React.ComponentProps<typeof Menu.Positioner>['alignOffset']
	side?: React.ComponentProps<typeof Menu.Positioner>['side']
	sideOffset?: React.ComponentProps<typeof Menu.Positioner>['sideOffset']
}

const styles = stylex.create({
	positioner: {
		zIndex: 50,
	},
	popup: {
		padding: spacing.xs,

		borderColor: dropdownMenuColors.popupBorder,
		borderRadius: radii.lg,
		borderStyle: 'solid',
		borderWidth: '1px',
		outline: 'none',
		backgroundColor: dropdownMenuColors.popupBackground,
		boxShadow: `0 8px 24px ${dropdownMenuColors.popupShadow}`,
		color: dropdownMenuColors.popupForeground,

		maxBlockSize: 'var(--available-height)',
		minInlineSize: '8rem',
		opacity: {
			default: 1,
			':is([data-starting-style], [data-ending-style])': 0,
		},
		transform: {
			default: 'scale(1)',
			':is([data-starting-style], [data-ending-style])': 'scale(0.96)',
		},
		transformOrigin: 'var(--transform-origin)',
		transitionDuration: '120ms',
		transitionProperty: 'opacity, transform',
		transitionTimingFunction: 'ease-out',
		overflowX: 'hidden',
		overflowY: 'auto',
	},
})

export function DropdownMenuContent({
	align = 'start',
	alignOffset,
	side,
	sideOffset = 4,
	...props
}: DropdownMenuContentProps) {
	return (
		<Menu.Portal>
			<Menu.Positioner
				align={align}
				alignOffset={alignOffset}
				side={side}
				sideOffset={sideOffset}
				{...stylex.props(styles.positioner)}
			>
				<Menu.Popup {...stylex.props(styles.popup)} {...props} />
			</Menu.Positioner>
		</Menu.Portal>
	)
}
