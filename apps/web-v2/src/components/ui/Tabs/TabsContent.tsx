import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import * as stylex from '@stylexjs/stylex'

import { colors } from '~/styles/tokens.stylex'

export type TabsContentProps = Omit<
	React.ComponentProps<typeof TabsPrimitive.Panel>,
	'className' | 'style'
>

const styles = stylex.create({
	content: {
		outlineColor: {
			default: 'transparent',
			':focus-visible': colors.focusRing,
		},
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
	},
})

export function TabsContent(props: TabsContentProps) {
	return <TabsPrimitive.Panel {...stylex.props(styles.content)} {...props} />
}
