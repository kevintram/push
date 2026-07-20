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
	innerContainer: {
		gap: spacing.sm,
		alignItems: 'center',
		display: 'flex',
	},
	content: {
		alignItems: 'center',
		columnGap: spacing.sm,
		display: 'inline-flex',
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
	slot: {
		alignItems: 'center',
		display: 'inline-flex',
		flexShrink: 0,
		justifyContent: 'center',
	},
})

export interface DropdownMenuCheckboxItemProps extends Omit<
	React.ComponentProps<typeof Menu.CheckboxItem>,
	'className' | 'style' | 'prefix' | 'suffix'
> {
	prefix?: React.ReactNode
	suffix?: React.ReactNode
}

export function DropdownMenuCheckboxItem({
	children,
	disabled,
	prefix,
	suffix,
	...props
}: DropdownMenuCheckboxItemProps) {
	return (
		<Menu.CheckboxItem
			disabled={disabled}
			{...stylex.props(styles.item, disabled && styles.disabled)}
			{...props}
		>
			<Menu.CheckboxItemIndicator {...stylex.props(styles.indicator)}>
				<Check aria-hidden size={16} />
			</Menu.CheckboxItemIndicator>
			<div {...stylex.props(styles.innerContainer)}>
				{prefix && <span {...stylex.props(styles.slot)}>{prefix}</span>}
				<span {...stylex.props(styles.content)}>{children}</span>
				{suffix && <span {...stylex.props(styles.slot)}>{suffix}</span>}
			</div>
		</Menu.CheckboxItem>
	)
}
