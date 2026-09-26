import { Menu } from '@base-ui/react/menu'
import * as stylex from '@stylexjs/stylex'

import { dropdownMenuColors } from '~/styles/colors/components.stylex'
import { spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	separator: {
		marginBlock: spacing.xs,
		marginInline: `calc(${spacing.xs} * -1)`,
		backgroundColor: dropdownMenuColors.separatorBackground,
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
