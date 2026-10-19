import * as stylex from '@stylexjs/stylex'
import { Toaster as SonnerToaster, type ToasterProps } from 'sonner'

import { semanticColors } from '~/styles/colors/semantic.stylex'
import { fonts, radii } from '~/styles/tokens.stylex'

const styles = stylex.create({
	toaster: {
		'--border-radius': {
			default: radii.lg,
			':is([data-sonner-toaster][data-sonner-theme])': radii.lg,
		},
		'--error-bg': {
			default: semanticColors.surfaceDanger,
			':is([data-sonner-toaster][data-sonner-theme])':
				semanticColors.surfaceDanger,
		},
		'--error-border': {
			default: semanticColors.borderDanger,
			':is([data-sonner-toaster][data-sonner-theme])':
				semanticColors.borderDanger,
		},
		'--error-text': {
			default: semanticColors.textDanger,
			':is([data-sonner-toaster][data-sonner-theme])':
				semanticColors.textDanger,
		},
		'--info-bg': {
			default: semanticColors.surfaceRaised,
			':is([data-sonner-toaster][data-sonner-theme])':
				semanticColors.surfaceRaised,
		},
		'--info-border': {
			default: semanticColors.borderPrimary,
			':is([data-sonner-toaster][data-sonner-theme])':
				semanticColors.borderPrimary,
		},
		'--info-text': {
			default: semanticColors.textPrimary,
			':is([data-sonner-toaster][data-sonner-theme])':
				semanticColors.textPrimary,
		},
		'--normal-bg': {
			default: semanticColors.surfaceRaised,
			':is([data-sonner-toaster][data-sonner-theme])':
				semanticColors.surfaceRaised,
		},
		'--normal-border': {
			default: semanticColors.borderPrimary,
			':is([data-sonner-toaster][data-sonner-theme])':
				semanticColors.borderPrimary,
		},
		'--normal-text': {
			default: semanticColors.textPrimary,
			':is([data-sonner-toaster][data-sonner-theme])':
				semanticColors.textPrimary,
		},
		'--success-bg': {
			default: semanticColors.surfaceRaised,
			':is([data-sonner-toaster][data-sonner-theme])':
				semanticColors.surfaceRaised,
		},
		'--success-border': {
			default: semanticColors.borderPrimary,
			':is([data-sonner-toaster][data-sonner-theme])':
				semanticColors.borderPrimary,
		},
		'--success-text': {
			default: semanticColors.textPrimary,
			':is([data-sonner-toaster][data-sonner-theme])':
				semanticColors.textPrimary,
		},
		'--warning-bg': {
			default: semanticColors.surfaceRaised,
			':is([data-sonner-toaster][data-sonner-theme])':
				semanticColors.surfaceRaised,
		},
		'--warning-border': {
			default: semanticColors.borderPrimary,
			':is([data-sonner-toaster][data-sonner-theme])':
				semanticColors.borderPrimary,
		},
		'--warning-text': {
			default: semanticColors.textPrimary,
			':is([data-sonner-toaster][data-sonner-theme])':
				semanticColors.textPrimary,
		},
		fontFamily: {
			default: fonts.sans,
			':is([data-sonner-toaster][data-sonner-theme])': fonts.sans,
		},
	},
})

export function Toaster({
	richColors = true,
	theme = 'system',
	toastOptions,
	...props
}: ToasterProps) {
	return (
		<SonnerToaster
			richColors={richColors}
			theme={theme}
			position='top-center'
			{...stylex.props(styles.toaster)}
			toastOptions={toastOptions}
			{...props}
		/>
	)
}
