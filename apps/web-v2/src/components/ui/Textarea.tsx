import * as stylex from '@stylexjs/stylex'

import { textareaColors } from '~/styles/colors/components.stylex'
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
		borderColor: textareaColors.border,
		paddingBlock: spacing.none,
		paddingInline: spacing.none,
		backgroundColor: textareaColors.background,
		color: {
			default: textareaColors.foreground,
			':disabled': textareaColors.foregroundDisabled,
		},
		cursor: { default: 'text', ':disabled': 'not-allowed' },
		display: 'block',
		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontWeight: 'inherit',
		inlineSize: '100%',
		lineHeight: 'inherit',
		outlineStyle: 'none',
		resize: 'none',
		'::placeholder': { color: textareaColors.placeholderForeground },
	},
})

export function Textarea({ xstyle, ...props }: TextareaProps) {
	return <textarea {...stylex.props(styles.textarea, xstyle)} {...props} />
}
