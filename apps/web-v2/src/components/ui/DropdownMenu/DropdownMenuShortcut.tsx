import * as stylex from '@stylexjs/stylex'

import { colors, fontSizes } from '~/styles/tokens.stylex'

const styles = stylex.create({
	shortcut: {
		color: colors.mutedForeground,
		fontSize: fontSizes.xs,
		letterSpacing: '0.1em',
		marginInlineStart: 'auto',
	},
})

export function DropdownMenuShortcut(props: React.ComponentProps<'span'>) {
	return <span {...stylex.props(styles.shortcut)} {...props} />
}
