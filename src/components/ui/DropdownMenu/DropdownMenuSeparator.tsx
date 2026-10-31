import { Menu } from '@base-ui/react/menu'
import * as stylex from '@stylexjs/stylex'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	separator: {
		marginBlock: spacing.xs,
		marginInline: `calc(${spacing.xs} * -1)`,
		backgroundColor: colorsSemantic.borderSubtle,
		blockSize: '1px',
	},
})

export function DropdownMenuSeparator(
	props: Omit<
		React.ComponentProps<typeof Menu.Separator>,
		'className' | 'style'
	>,
) {
	return <Menu.Separator {...stylex.props(styles.separator)} {...props} />
}
