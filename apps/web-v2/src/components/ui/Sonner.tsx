import * as stylex from '@stylexjs/stylex'
import { Toaster as SonnerToaster, type ToasterProps } from 'sonner'

import { colors } from '~/styles/colors.stylex'
import { fonts, radii } from '~/styles/tokens.stylex'

const styles = stylex.create({
	toaster: {
		'--border-radius': {
			default: radii.lg,
			':is([data-sonner-toaster][data-sonner-theme])': radii.lg,
		},
		'--error-bg': {
			default: colors.bgSurfaceDanger,
			':is([data-sonner-toaster][data-sonner-theme])':
				colors.bgSurfaceDanger,
		},
		'--error-border': {
			default: colors.borderDanger,
			':is([data-sonner-toaster][data-sonner-theme])':
				colors.borderDanger,
		},
		'--error-text': {
			default: colors.textDanger,
			':is([data-sonner-toaster][data-sonner-theme])': colors.textDanger,
		},
		'--info-bg': {
			default: colors.bgSurfaceInfo,
			':is([data-sonner-toaster][data-sonner-theme])':
				colors.bgSurfaceInfo,
		},
		'--info-border': {
			default: colors.borderInfo,
			':is([data-sonner-toaster][data-sonner-theme])': colors.borderInfo,
		},
		'--info-text': {
			default: colors.textInfo,
			':is([data-sonner-toaster][data-sonner-theme])': colors.textInfo,
		},
		'--normal-bg': {
			default: colors.bgSurface,
			':is([data-sonner-toaster][data-sonner-theme])': colors.bgSurface,
		},
		'--normal-border': {
			default: colors.border,
			':is([data-sonner-toaster][data-sonner-theme])': colors.border,
		},
		'--normal-text': {
			default: colors.text,
			':is([data-sonner-toaster][data-sonner-theme])': colors.text,
		},
		'--success-bg': {
			default: colors.bgSurfaceSuccess,
			':is([data-sonner-toaster][data-sonner-theme])':
				colors.bgSurfaceSuccess,
		},
		'--success-border': {
			default: colors.borderSuccess,
			':is([data-sonner-toaster][data-sonner-theme])':
				colors.borderSuccess,
		},
		'--success-text': {
			default: colors.textSuccess,
			':is([data-sonner-toaster][data-sonner-theme])': colors.textSuccess,
		},
		'--warning-bg': {
			default: colors.bgSurfaceWarning,
			':is([data-sonner-toaster][data-sonner-theme])':
				colors.bgSurfaceWarning,
		},
		'--warning-border': {
			default: colors.borderWarning,
			':is([data-sonner-toaster][data-sonner-theme])':
				colors.borderWarning,
		},
		'--warning-text': {
			default: colors.textWarning,
			':is([data-sonner-toaster][data-sonner-theme])': colors.textWarning,
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
			{...stylex.props(styles.toaster)}
			toastOptions={toastOptions}
			{...props}
		/>
	)
}
