import * as stylex from '@stylexjs/stylex'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
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
		borderColor: colorsSemantic.surfaceTransparent,
		paddingBlock: spacing.none,
		paddingInline: spacing.none,
		backgroundColor: colorsSemantic.surfaceTransparent,
		color: {
			default: colorsSemantic.textPrimary,
			':disabled': colorsSemantic.textDisabled,
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
		'::placeholder': { color: colorsSemantic.textSecondary },
	},
})

export function Textarea({ xstyle, ...props }: TextareaProps) {
	return <textarea {...stylex.props(styles.textarea, xstyle)} {...props} />
}
