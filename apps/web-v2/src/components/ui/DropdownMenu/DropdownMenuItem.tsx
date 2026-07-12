import { Menu } from '@base-ui/react/menu'
import * as stylex from '@stylexjs/stylex'

import { colors, fontSizes, radii, spacing } from '~/styles/tokens.stylex'

export interface DropdownMenuItemProps extends React.ComponentProps<
	typeof Menu.Item
> {
	inset?: boolean
	variant?: 'default' | 'destructive'
}

const styles = stylex.create({
	item: {
		paddingBlock: '6px',
		paddingInline: spacing.sm,

		alignItems: 'center',
		columnGap: spacing.sm,
		display: 'flex',

		borderRadius: radii.sm,
		outline: 'none',
		backgroundColor: {
			default: 'transparent',
			':is([data-highlighted])': colors.surfaceActive,
		},
		color: {
			default: colors.foreground,
			':is([data-highlighted])': colors.foreground,
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
	destructive: {
		backgroundColor: {
			default: 'transparent',
			':is([data-highlighted])': colors.destructiveMuted,
		},
		color: {
			default: colors.destructive,
			':is([data-highlighted])': colors.destructive,
		},
	},
})

export function DropdownMenuItem({
	inset = false,
	variant = 'default',
	disabled,
	...props
}: DropdownMenuItemProps) {
	return (
		<Menu.Item
			disabled={disabled}
			{...stylex.props(
				styles.item,
				inset && styles.inset,
				variant === 'destructive' && styles.destructive,
				disabled && styles.disabled,
			)}
			{...props}
		/>
	)
}
