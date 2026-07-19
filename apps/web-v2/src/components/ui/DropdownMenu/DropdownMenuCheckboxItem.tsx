import { Menu } from '@base-ui/react/menu'
import * as stylex from '@stylexjs/stylex'
import { Check } from 'lucide-react'

import { colors } from '~/styles/colors.stylex'
import { fontSizes, radii, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	item: {
		paddingBlock: '6px',
		paddingInlineEnd: spacing.sm,
		paddingInlineStart: spacing['2xl'],

		alignItems: 'center',
		display: 'flex',
		position: 'relative',

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
	indicator: {
		alignItems: 'center',
		display: 'flex',
		insetInlineStart: spacing.sm,
		justifyContent: 'center',
		position: 'absolute',
	},
})

export function DropdownMenuCheckboxItem({
	children,
	disabled,
	...props
}: Omit<
	React.ComponentProps<typeof Menu.CheckboxItem>,
	'className' | 'style'
>) {
	return (
		<Menu.CheckboxItem
			disabled={disabled}
			{...stylex.props(styles.item, disabled && styles.disabled)}
			{...props}
		>
			<Menu.CheckboxItemIndicator {...stylex.props(styles.indicator)}>
				<Check aria-hidden size={16} />
			</Menu.CheckboxItemIndicator>
			{children}
		</Menu.CheckboxItem>
	)
}
