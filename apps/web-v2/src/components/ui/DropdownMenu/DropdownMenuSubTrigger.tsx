import { Menu } from '@base-ui/react/menu'
import * as stylex from '@stylexjs/stylex'
import { ChevronRight } from 'lucide-react'

import { dropdownMenuColors } from '~/styles/colors/components.stylex'
import { fontSizes, iconSizes, radii, spacing } from '~/styles/tokens.stylex'

export interface DropdownMenuSubTriggerProps extends Omit<
	React.ComponentProps<typeof Menu.SubmenuTrigger>,
	'className' | 'style'
> {
	inset?: boolean
}

const styles = stylex.create({
	trigger: {
		paddingBlock: '6px',
		paddingInline: spacing.sm,

		alignItems: 'center',
		columnGap: spacing.sm,
		display: 'flex',

		borderRadius: radii.xs,
		outline: 'none',
		backgroundColor: {
			default: dropdownMenuColors.subTriggerBackground,
			':is([data-highlighted], [data-popup-open])':
				dropdownMenuColors.subTriggerBackgroundHighlighted,
		},
		color: {
			default: dropdownMenuColors.subTriggerForeground,
			':is([data-highlighted], [data-popup-open])':
				dropdownMenuColors.subTriggerForegroundHighlighted,
			':active': dropdownMenuColors.subTriggerForegroundPressed,
		},
		cursor: 'default',
		fontSize: fontSizes.sm,
		userSelect: 'none',
		whiteSpace: 'nowrap',
	},
	inset: {
		paddingInlineStart: spacing['2xl'],
	},
	icon: {
		marginInlineStart: 'auto',
	},
})

export function DropdownMenuSubTrigger({
	children,
	inset = false,
	...props
}: DropdownMenuSubTriggerProps) {
	return (
		<Menu.SubmenuTrigger
			{...stylex.props(styles.trigger, inset && styles.inset)}
			{...props}
		>
			{children}
			<ChevronRight
				aria-hidden
				size={iconSizes.md}
				{...stylex.props(styles.icon)}
			/>
		</Menu.SubmenuTrigger>
	)
}
