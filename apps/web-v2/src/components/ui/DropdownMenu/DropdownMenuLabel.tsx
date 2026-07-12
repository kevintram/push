import { Menu } from '@base-ui/react/menu'
import * as stylex from '@stylexjs/stylex'

import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

export interface DropdownMenuLabelProps extends React.ComponentProps<
	typeof Menu.GroupLabel
> {
	inset?: boolean
}

const styles = stylex.create({
	label: {
		paddingBlock: '6px',
		paddingInline: spacing.sm,
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
	},
	inset: {
		paddingInlineStart: spacing['2xl'],
	},
})

export function DropdownMenuLabel({
	inset = false,
	...props
}: DropdownMenuLabelProps) {
	return (
		<Menu.GroupLabel
			{...stylex.props(styles.label, inset && styles.inset)}
			{...props}
		/>
	)
}
