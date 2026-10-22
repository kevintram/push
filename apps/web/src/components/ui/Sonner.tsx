import * as stylex from '@stylexjs/stylex'
import { Toaster as SonnerToaster, type ToasterProps } from 'sonner'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { fonts, radii } from '~/styles/tokens.stylex'

const styles = stylex.create({
	toaster: {
		'--border-radius': {
			default: radii.lg,
			':is([data-sonner-toaster][data-sonner-theme])': radii.lg,
		},
		'--error-bg': {
			default: colorsSemantic.surfaceDanger,
			':is([data-sonner-toaster][data-sonner-theme])':
				colorsSemantic.surfaceDanger,
		},
		'--error-border': {
			default: colorsSemantic.borderDanger,
			':is([data-sonner-toaster][data-sonner-theme])':
				colorsSemantic.borderDanger,
		},
		'--error-text': {
			default: colorsSemantic.textDanger,
			':is([data-sonner-toaster][data-sonner-theme])':
				colorsSemantic.textDanger,
		},
		'--info-bg': {
			default: colorsSemantic.surfaceRaised,
			':is([data-sonner-toaster][data-sonner-theme])':
				colorsSemantic.surfaceRaised,
		},
		'--info-border': {
			default: colorsSemantic.borderPrimary,
			':is([data-sonner-toaster][data-sonner-theme])':
				colorsSemantic.borderPrimary,
		},
		'--info-text': {
			default: colorsSemantic.textPrimary,
			':is([data-sonner-toaster][data-sonner-theme])':
				colorsSemantic.textPrimary,
		},
		'--normal-bg': {
			default: colorsSemantic.surfaceRaised,
			':is([data-sonner-toaster][data-sonner-theme])':
				colorsSemantic.surfaceRaised,
		},
		'--normal-border': {
			default: colorsSemantic.borderPrimary,
			':is([data-sonner-toaster][data-sonner-theme])':
				colorsSemantic.borderPrimary,
		},
		'--normal-text': {
			default: colorsSemantic.textPrimary,
			':is([data-sonner-toaster][data-sonner-theme])':
				colorsSemantic.textPrimary,
		},
		'--success-bg': {
			default: colorsSemantic.surfaceRaised,
			':is([data-sonner-toaster][data-sonner-theme])':
				colorsSemantic.surfaceRaised,
		},
		'--success-border': {
			default: colorsSemantic.borderPrimary,
			':is([data-sonner-toaster][data-sonner-theme])':
				colorsSemantic.borderPrimary,
		},
		'--success-text': {
			default: colorsSemantic.textPrimary,
			':is([data-sonner-toaster][data-sonner-theme])':
				colorsSemantic.textPrimary,
		},
		'--warning-bg': {
			default: colorsSemantic.surfaceRaised,
			':is([data-sonner-toaster][data-sonner-theme])':
				colorsSemantic.surfaceRaised,
		},
		'--warning-border': {
			default: colorsSemantic.borderPrimary,
			':is([data-sonner-toaster][data-sonner-theme])':
				colorsSemantic.borderPrimary,
		},
		'--warning-text': {
			default: colorsSemantic.textPrimary,
			':is([data-sonner-toaster][data-sonner-theme])':
				colorsSemantic.textPrimary,
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
