import * as stylex from '@stylexjs/stylex'

import { breakpoints, spacing } from '~/styles/tokens.stylex'

export interface DialogFooterProps extends Omit<
	React.ComponentProps<'div'>,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	footer: {
		gap: spacing.sm,
		display: 'flex',
		flexDirection: {
			default: 'column-reverse',
			[breakpoints.tablet]: 'row',
		},
		justifyContent: {
			default: 'normal',
			[breakpoints.tablet]: 'flex-end',
		},
	},
})

export function DialogFooter({ xstyle, ...props }: DialogFooterProps) {
	return <div {...stylex.props(styles.footer, xstyle)} {...props} />
}
