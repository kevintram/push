import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import * as stylex from '@stylexjs/stylex'

import { spacing } from '~/styles/tokens.stylex'

export interface TabsProps extends Omit<
	React.ComponentProps<typeof TabsPrimitive.Root>,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	root: {
		gap: spacing.sm,
		display: 'flex',
		flexDirection: {
			default: 'column',
			':is([data-orientation="vertical"])': 'row',
		},
	},
})

export function Tabs({ xstyle, ...props }: TabsProps) {
	return (
		<TabsPrimitive.Root {...stylex.props(styles.root, xstyle)} {...props} />
	)
}
