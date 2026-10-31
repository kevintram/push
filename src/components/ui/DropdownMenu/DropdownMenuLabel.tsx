import { Menu } from '@base-ui/react/menu'
import * as stylex from '@stylexjs/stylex'

import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

import { menuVars } from './menu.stylex'

export type DropdownMenuLabelProps = Omit<
	React.ComponentProps<typeof Menu.GroupLabel>,
	'className' | 'style'
>

const styles = stylex.create({
	label: {
		paddingBlock: '6px',
		paddingInlineEnd: spacing.sm,
		paddingInlineStart: menuVars.labelInsetStart,

		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
	},
})

export function DropdownMenuLabel(props: DropdownMenuLabelProps) {
	return <Menu.GroupLabel {...stylex.props(styles.label)} {...props} />
}
