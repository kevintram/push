import * as stylex from '@stylexjs/stylex'

import { baseColors } from '~/styles/colorPrimitives.stylex'
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
		borderColor: baseColors.transparent,
		borderRadius: radii.lg,
		borderStyle: 'solid',
		borderWidth: '1px',
		paddingBlock: spacing.sm,
		paddingInline: spacing.md,
		backgroundColor: baseColors.transparent,
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
		outlineColor: baseColors.transparent,
		resize: 'none',
		'::placeholder': { color: colors.textSecondary },
	},
})

export function Textarea({ xstyle, ...props }: TextareaProps) {
	return <textarea {...stylex.props(styles.textarea, xstyle)} {...props} />
}
