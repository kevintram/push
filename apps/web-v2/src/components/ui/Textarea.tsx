import * as stylex from '@stylexjs/stylex'

import { baseColors } from '~/styles/colorPrimitives.stylex'
import { colors } from '~/styles/colors.stylex'
import { spacing } from '~/styles/tokens.stylex'

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
		paddingBlock: spacing.none,
		paddingInline: spacing.none,
		backgroundColor: baseColors.transparent,
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
