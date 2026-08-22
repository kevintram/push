import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import * as stylex from '@stylexjs/stylex'

import { dialogColors } from '~/styles/componentColors.stylex'
import { fontSizes } from '~/styles/tokens.stylex'

export interface DialogDescriptionProps extends Omit<
	DialogPrimitive.Description.Props,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	description: {
		color: dialogColors.descriptionForeground,
		fontSize: fontSizes.sm,
		lineHeight: 1.5,
	},
})

export function DialogDescription({
	xstyle,
	...props
}: DialogDescriptionProps) {
	return (
		<DialogPrimitive.Description
			{...stylex.props(styles.description, xstyle)}
			{...props}
		/>
	)
}
