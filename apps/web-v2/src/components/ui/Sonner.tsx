import * as stylex from '@stylexjs/stylex'
import { Toaster as SonnerToaster, type ToasterProps } from 'sonner'

import { colors, fonts, radii } from '~/styles/tokens.stylex'

const styles = stylex.create({
	toaster: {
		'--border-radius': radii.md,
		'--error-bg': colors.destructiveMuted,
		'--error-border': colors.destructive,
		'--error-text': colors.destructive,
		'--normal-bg': colors.surface,
		'--normal-border': colors.border,
		'--normal-text': colors.foreground,
		fontFamily: fonts.sans,
	},
})

export function Toaster(props: ToasterProps) {
	return (
		<SonnerToaster
			theme='system'
			{...stylex.props(styles.toaster)}
			{...props}
		/>
	)
}
