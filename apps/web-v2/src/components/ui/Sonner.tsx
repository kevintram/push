import * as stylex from '@stylexjs/stylex'
import { Toaster as SonnerToaster, type ToasterProps } from 'sonner'

import { toasterColors } from '~/styles/componentColors.stylex'
import { fonts, radii } from '~/styles/tokens.stylex'

const styles = stylex.create({
	toaster: {
		'--border-radius': {
			default: radii.lg,
			':is([data-sonner-toaster][data-sonner-theme])': radii.lg,
		},
		'--error-bg': {
			default: toasterColors.errorBackground,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.errorBackground,
		},
		'--error-border': {
			default: toasterColors.errorBorder,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.errorBorder,
		},
		'--error-text': {
			default: toasterColors.errorForeground,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.errorForeground,
		},
		'--info-bg': {
			default: toasterColors.infoBackground,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.infoBackground,
		},
		'--info-border': {
			default: toasterColors.infoBorder,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.infoBorder,
		},
		'--info-text': {
			default: toasterColors.infoForeground,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.infoForeground,
		},
		'--normal-bg': {
			default: toasterColors.normalBackground,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.normalBackground,
		},
		'--normal-border': {
			default: toasterColors.normalBorder,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.normalBorder,
		},
		'--normal-text': {
			default: toasterColors.normalForeground,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.normalForeground,
		},
		'--success-bg': {
			default: toasterColors.successBackground,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.successBackground,
		},
		'--success-border': {
			default: toasterColors.successBorder,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.successBorder,
		},
		'--success-text': {
			default: toasterColors.successForeground,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.successForeground,
		},
		'--warning-bg': {
			default: toasterColors.warningBackground,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.warningBackground,
		},
		'--warning-border': {
			default: toasterColors.warningBorder,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.warningBorder,
		},
		'--warning-text': {
			default: toasterColors.warningForeground,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.warningForeground,
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
