import * as stylex from '@stylexjs/stylex'

import { dropdownMenuColors } from '~/styles/componentColors.stylex'
import { fontSizes } from '~/styles/tokens.stylex'

const styles = stylex.create({
	shortcut: {
		color: dropdownMenuColors.shortcutForeground,
		fontSize: fontSizes.xs,
		letterSpacing: '0.1em',
		marginInlineStart: 'auto',
	},
})

export function DropdownMenuShortcut(
	props: Omit<React.ComponentProps<'span'>, 'className' | 'style'>,
) {
	return <span {...stylex.props(styles.shortcut)} {...props} />
}
