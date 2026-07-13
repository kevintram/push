import * as stylex from '@stylexjs/stylex'

import { colors, radii, spacing } from '~/styles/tokens.stylex'

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
			default: colors.border,
			':focus-visible': colors.focusRing,
			':is([aria-invalid="true"])': colors.destructive,
			':disabled': colors.border,
		},
		borderRadius: radii.md,
		borderStyle: 'solid',
		borderWidth: '1px',
		paddingBlock: spacing.sm,
		paddingInline: spacing.md,
		backgroundColor: 'transparent',
		boxSizing: 'border-box',
		color: colors.foreground,
		cursor: { default: 'text', ':disabled': 'not-allowed' },
		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontWeight: 'inherit',
		inlineSize: '100%',
		lineHeight: 'inherit',
		minBlockSize: '64px',
		opacity: { default: 1, ':disabled': 0.5 },
		outlineColor: {
			default: 'transparent',
			':focus-visible': colors.focusRing,
		},
		outlineOffset: '1px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		resize: 'none',
		'::placeholder': { color: colors.mutedForeground },
	},
})

export function Textarea({ xstyle, ...props }: TextareaProps) {
	return <textarea {...stylex.props(styles.textarea, xstyle)} {...props} />
}
