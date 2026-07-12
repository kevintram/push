import { Menu } from '@base-ui/react/menu'
import * as stylex from '@stylexjs/stylex'

import { colors, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	separator: {
		marginBlock: spacing.xs,
		marginInline: `calc(${spacing.xs} * -1)`,
		backgroundColor: colors.border,
		blockSize: '1px',
	},
})

export function DropdownMenuSeparator(
	props: React.ComponentProps<typeof Menu.Separator>,
) {
	return <Menu.Separator {...stylex.props(styles.separator)} {...props} />
}
