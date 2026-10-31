import * as stylex from '@stylexjs/stylex'

import { spacing } from '~/styles/tokens.stylex'

export interface DialogHeaderProps extends Omit<
	React.ComponentProps<'div'>,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	header: {
		gap: spacing.sm,
		display: 'flex',
		inlineSize: '100%',
	},
})

export function DialogHeader({ xstyle, ...props }: DialogHeaderProps) {
	return <div {...stylex.props(styles.header, xstyle)} {...props} />
}
