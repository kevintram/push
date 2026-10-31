import { Menu } from '@base-ui/react/menu'
import * as stylex from '@stylexjs/stylex'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { fontSizes, radii, spacing } from '~/styles/tokens.stylex'

import { DropdownMenuItemTrailing } from './DropdownMenuItemTrailing'
import { menuVars } from './menu.stylex'

export interface DropdownMenuItemProps extends Omit<
	React.ComponentProps<typeof Menu.Item>,
	'className' | 'style'
> {
	// Leading glyph. When any item in the menu has one, every item's label
	// starts past the icon column.
	icon?: React.ReactNode
	/** Content in the trailing column, aligned across the menu's rows. */
	trailing?: React.ReactNode
}

const styles = stylex.create({
	item: {
		paddingBlock: '6px',
		paddingInlineEnd: spacing.sm,
		paddingInlineStart: menuVars.labelInsetStart,

		alignItems: 'center',
		columnGap: spacing.sm,
		display: 'flex',
		position: 'relative',

		borderRadius: radii.xs,
		outline: 'none',
		backgroundColor: {
			default: colorsSemantic.surfaceTransparent,
			':is([data-highlighted])': colorsSemantic.surfaceTransparentHover,
		},
		color: {
			default: colorsSemantic.textInteractive,
			':is([data-highlighted])': colorsSemantic.textInteractiveHover,
			':active': colorsSemantic.textInteractiveActive,
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
		flexGrow: 1,
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
	icon: {
		alignItems: 'center',
		display: 'flex',
		insetInlineStart: spacing.sm,
		justifyContent: 'center',
		position: 'absolute',
	},
})

export function DropdownMenuItem({
	disabled,
	children,
	icon,
	trailing,
	...props
}: DropdownMenuItemProps) {
	return (
		<Menu.Item
			disabled={disabled}
			{...stylex.props(styles.item, disabled && styles.disabled)}
			{...props}
		>
			{icon && (
				<span data-menu-icon='' {...stylex.props(styles.icon)}>
					{icon}
				</span>
			)}
			<div {...stylex.props(styles.innerContainer)}>
				<span {...stylex.props(styles.content)}>{children}</span>
				{trailing != null && (
					<DropdownMenuItemTrailing>
						{trailing}
					</DropdownMenuItemTrailing>
				)}
			</div>
		</Menu.Item>
	)
}
