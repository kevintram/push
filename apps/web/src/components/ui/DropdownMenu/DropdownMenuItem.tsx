import { Menu } from '@base-ui/react/menu'
import * as stylex from '@stylexjs/stylex'

import { semanticColors } from '~/styles/colors/semantic.stylex'
import { fontSizes, radii, spacing } from '~/styles/tokens.stylex'

export interface DropdownMenuItemProps extends Omit<
	React.ComponentProps<typeof Menu.Item>,
	'className' | 'style' | 'prefix' | 'suffix'
> {
	inset?: boolean
	prefix?: React.ReactNode
	suffix?: React.ReactNode
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
			default: semanticColors.surfaceTransparent,
			':is([data-highlighted])': semanticColors.surfaceTransparentHover,
		},
		color: {
			default: semanticColors.textInteractive,
			':is([data-highlighted])': semanticColors.textInteractiveHover,
			':active': semanticColors.textInteractiveActive,
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
	inset: {
		paddingInlineStart: spacing['2xl'],
	},
	slot: {
		alignItems: 'center',
		display: 'inline-flex',
		flexShrink: 0,
		justifyContent: 'center',
	},
})

export function DropdownMenuItem({
	inset = false,
	disabled,
	children,
	prefix,
	suffix,
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
		>
			<div {...stylex.props(styles.innerContainer)}>
				{prefix && <span {...stylex.props(styles.slot)}>{prefix}</span>}
				<span {...stylex.props(styles.content)}>{children}</span>
				{suffix && <span {...stylex.props(styles.slot)}>{suffix}</span>}
			</div>
		</Menu.Item>
	)
}
