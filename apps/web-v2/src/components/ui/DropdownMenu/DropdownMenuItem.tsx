import { Menu } from '@base-ui/react/menu'
import * as stylex from '@stylexjs/stylex'

import { colors } from '~/styles/colors.stylex'
import { fontSizes, radii, spacing } from '~/styles/tokens.stylex'

export interface DropdownMenuItemProps extends Omit<
	React.ComponentProps<typeof Menu.Item>,
	'className' | 'style'
> {
	inset?: boolean
}

const styles = stylex.create({
	item: {
		paddingBlock: '6px',
		paddingInline: spacing.sm,

		alignItems: 'center',
		columnGap: spacing.sm,
		display: 'flex',

		borderRadius: radii.xs,
		outline: 'none',
		backgroundColor: {
			default: colors.bgSurfaceTransparent,
			':is([data-highlighted])': colors.bgSurfaceSecondaryHover,
		},
		color: {
			default: colors.textInteractive,
			':is([data-highlighted])': colors.textInteractiveHover,
			':active': colors.textInteractiveActive,
		},
		cursor: 'default',
		fontSize: fontSizes.sm,
		userSelect: 'none',
		whiteSpace: 'nowrap',
	},
	disabled: {
		opacity: 0.5,
		pointerEvents: 'none',
	},
	inset: {
		paddingInlineStart: spacing['2xl'],
	},
})

export function DropdownMenuItem({
	inset = false,
	disabled,
	...props
}: DropdownMenuItemProps) {
	return (
		<Menu.Item
			disabled={disabled}
			{...stylex.props(
				styles.item,
				inset && styles.inset,
				disabled && styles.disabled,
			)}
			{...props}
		/>
	)
}
