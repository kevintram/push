import * as stylex from '@stylexjs/stylex'

import { colors } from '~/styles/colors.stylex'
import { radii, spacing } from '~/styles/tokens.stylex'

export interface TextareaProps extends Omit<
	React.ComponentProps<'textarea'>,
	'className' | 'style'
> {
	// TODO: remove this maybe?
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	textarea: {
		fieldSizing: 'content',
		borderColor: {
			default: colors.inputBorder,
			':focus-visible': colors.inputBorderActive,
			':is(:disabled:hover)': colors.borderDisabled,
			':is([aria-invalid="true"])': colors.borderDangerSecondary,
			':is([aria-invalid="true"]:hover)': colors.borderDangerSecondary,
			':disabled': colors.borderDisabled,
			':hover': colors.inputBorderHover,
		},
		borderRadius: radii.lg,
		borderStyle: 'solid',
		borderWidth: '1px',
		paddingBlock: spacing.sm,
		paddingInline: spacing.md,
		backgroundColor: {
			default: colors.inputBgSurface,
			':focus-visible': colors.inputBgSurfaceActive,
			':is(:disabled:hover)': colors.bgSurfaceDisabled,
			':disabled': colors.bgSurfaceDisabled,
			':hover': colors.inputBgSurfaceHover,
		},
		boxSizing: 'border-box',
		color: {
			default: colors.text,
			':disabled': colors.textDisabled,
		},
		cursor: { default: 'text', ':disabled': 'not-allowed' },
		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontWeight: 'inherit',
		inlineSize: '100%',
		lineHeight: 'inherit',
		minBlockSize: '64px',
		outlineColor: {
			default: 'transparent',
			':focus-visible': colors.borderFocus,
		},
		outlineOffset: '1px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		resize: 'none',
		'::placeholder': { color: colors.textSecondary },
	},
})

export function Textarea({ xstyle, ...props }: TextareaProps) {
	return <textarea {...stylex.props(styles.textarea, xstyle)} {...props} />
}
