import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import * as stylex from '@stylexjs/stylex'

import { fontSizes, fontWeights } from '~/styles/tokens.stylex'

export interface DialogTitleProps extends Omit<
	DialogPrimitive.Title.Props,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	title: {
		fontSize: fontSizes.lg,
		fontWeight: fontWeights.semibold,
		lineHeight: 1.25,
	},
})

export function DialogTitle({ xstyle, ...props }: DialogTitleProps) {
	return (
		<DialogPrimitive.Title
			{...stylex.props(styles.title, xstyle)}
			{...props}
		/>
	)
}
