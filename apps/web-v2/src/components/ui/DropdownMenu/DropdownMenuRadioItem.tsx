import { Menu } from '@base-ui/react/menu'
import * as stylex from '@stylexjs/stylex'
import { Circle } from 'lucide-react'

import { colors, fontSizes, radii, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	item: {
		paddingBlock: '6px',
		paddingInlineEnd: spacing.sm,
		paddingInlineStart: spacing['2xl'],

		alignItems: 'center',
		display: 'flex',
		position: 'relative',

		borderRadius: radii.sm,
		outline: 'none',
		backgroundColor: {
			default: 'transparent',
			':is([data-highlighted])': colors.surfaceActive,
		},
		color: colors.foreground,
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

export function DropdownMenuRadioItem({
	children,
	disabled,
	...props
}: React.ComponentProps<typeof Menu.RadioItem>) {
	return (
		<Menu.RadioItem
			disabled={disabled}
			{...stylex.props(styles.item, disabled && styles.disabled)}
			{...props}
		>
			<Menu.RadioItemIndicator {...stylex.props(styles.indicator)}>
				<Circle aria-hidden fill='currentColor' size={8} />
			</Menu.RadioItemIndicator>
			{children}
		</Menu.RadioItem>
	)
}
