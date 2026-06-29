import * as stylex from '@stylexjs/stylex'

import { colors, fonts } from '../styles/theme.stylex'

export const styles = stylex.create({
	shell: {
		minHeight: '100%',
		backgroundColor: colors.background,
		color: colors.foreground,
		fontFamily: fonts.sans,
	},
})
