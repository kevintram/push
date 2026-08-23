import * as stylex from '@stylexjs/stylex'
import { Toaster as SonnerToaster, type ToasterProps } from 'sonner'

import { toasterColors } from '~/styles/colors/components.stylex'
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
			default: toasterColors.normalBackground,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.normalBackground,
		},
		'--info-border': {
			default: toasterColors.normalBorder,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.normalBorder,
		},
		'--info-text': {
			default: toasterColors.normalForeground,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.normalForeground,
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
			default: toasterColors.normalBackground,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.normalBackground,
		},
		'--success-border': {
			default: toasterColors.normalBorder,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.normalBorder,
		},
		'--success-text': {
			default: toasterColors.normalForeground,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.normalForeground,
		},
		'--warning-bg': {
			default: toasterColors.normalBackground,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.normalBackground,
		},
		'--warning-border': {
			default: toasterColors.normalBorder,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.normalBorder,
		},
		'--warning-text': {
			default: toasterColors.normalForeground,
			':is([data-sonner-toaster][data-sonner-theme])':
				toasterColors.normalForeground,
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
