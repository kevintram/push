import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import * as stylex from '@stylexjs/stylex'

import { semanticColors } from '~/styles/colors/semantic.stylex'

export type TabsContentProps = Omit<
	React.ComponentProps<typeof TabsPrimitive.Panel>,
	'className' | 'style'
>

const styles = stylex.create({
	content: {
		outlineColor: {
			default: semanticColors.surfaceTransparent,
			':focus-visible': semanticColors.borderFocus,
		},
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
	},
})

export function TabsContent(props: TabsContentProps) {
	return <TabsPrimitive.Panel {...stylex.props(styles.content)} {...props} />
}
