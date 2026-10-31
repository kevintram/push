import { Menu } from '@base-ui/react/menu'
import * as stylex from '@stylexjs/stylex'
import { Check } from 'lucide-react'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { fontSizes, iconSizes, radii, spacing } from '~/styles/tokens.stylex'

import { DropdownMenuItemTrailing } from './DropdownMenuItemTrailing'

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
	'className' | 'style' | 'prefix'
> {
	prefix?: React.ReactNode
	/** Content in the trailing column, aligned across the menu's rows. */
	trailing?: React.ReactNode
}

export function DropdownMenuCheckboxItem({
	children,
	disabled,
	prefix,
	trailing,
	...props
}: DropdownMenuCheckboxItemProps) {
	return (
		<Menu.CheckboxItem
			disabled={disabled}
			{...stylex.props(styles.item, disabled && styles.disabled)}
			{...props}
		>
			<Menu.CheckboxItemIndicator {...stylex.props(styles.indicator)}>
				<Check aria-hidden size={iconSizes.sm} />
			</Menu.CheckboxItemIndicator>
			<div {...stylex.props(styles.innerContainer)}>
				{prefix && <span {...stylex.props(styles.slot)}>{prefix}</span>}
				<span {...stylex.props(styles.content)}>{children}</span>
				{trailing != null && (
					<DropdownMenuItemTrailing>
						{trailing}
					</DropdownMenuItemTrailing>
				)}
			</div>
		</Menu.CheckboxItem>
	)
}
