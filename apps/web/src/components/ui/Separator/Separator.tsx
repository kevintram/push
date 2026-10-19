import { Separator as SeparatorPrimitive } from '@base-ui/react/separator'
import * as stylex from '@stylexjs/stylex'

import { semanticColors } from '~/styles/colors/semantic.stylex'

export interface SeparatorProps extends Omit<
	React.ComponentProps<typeof SeparatorPrimitive>,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	root: {
		alignSelf: {
			default: 'auto',
			':is([data-orientation="vertical"])': 'stretch',
		},
		backgroundColor: semanticColors.borderSubtle,
		blockSize: {
			default: '1px',
			':is([data-orientation="vertical"])': 'auto',
		},
		flexShrink: 0,
		inlineSize: {
			default: '100%',
			':is([data-orientation="vertical"])': '1px',
		},
	},
})

export function Separator({ xstyle, ...props }: SeparatorProps) {
	return (
		<SeparatorPrimitive {...stylex.props(styles.root, xstyle)} {...props} />
	)
}
