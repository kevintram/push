import * as stylex from '@stylexjs/stylex'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { fontSizes } from '~/styles/tokens.stylex'

const styles = stylex.create({
	shortcut: {
		color: colorsSemantic.textSecondary,
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
