import * as stylex from '@stylexjs/stylex'

import { semanticColors } from '~/styles/colors/semantic.stylex'
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
		borderColor: semanticColors.surfaceTransparent,
		paddingBlock: spacing.none,
		paddingInline: spacing.none,
		backgroundColor: semanticColors.surfaceTransparent,
		color: {
			default: semanticColors.textPrimary,
			':disabled': semanticColors.textDisabled,
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
		'::placeholder': { color: semanticColors.textSecondary },
	},
})

export function Textarea({ xstyle, ...props }: TextareaProps) {
	return <textarea {...stylex.props(styles.textarea, xstyle)} {...props} />
}
