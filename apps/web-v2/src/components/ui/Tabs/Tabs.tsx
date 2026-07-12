import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import * as stylex from '@stylexjs/stylex'

import { spacing } from '~/styles/tokens.stylex'

export type TabsProps = React.ComponentProps<typeof TabsPrimitive.Root>

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

export function Tabs(props: TabsProps) {
	return <TabsPrimitive.Root {...stylex.props(styles.root)} {...props} />
}
