import * as stylex from '@stylexjs/stylex'

import { spacing } from '~/styles/tokens.stylex'

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
			'@media (min-width: 640px)': 'row',
		},
		justifyContent: {
			default: 'normal',
			'@media (min-width: 640px)': 'flex-end',
		},
	},
})

export function DialogFooter({ xstyle, ...props }: DialogFooterProps) {
	return <div {...stylex.props(styles.footer, xstyle)} {...props} />
}
