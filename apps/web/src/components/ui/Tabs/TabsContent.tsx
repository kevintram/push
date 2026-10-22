import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import * as stylex from '@stylexjs/stylex'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'

export type TabsContentProps = Omit<
	React.ComponentProps<typeof TabsPrimitive.Panel>,
	'className' | 'style'
>

const styles = stylex.create({
	content: {
		outlineColor: {
			default: colorsSemantic.surfaceTransparent,
			':focus-visible': colorsSemantic.borderFocus,
		},
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
	},
})

export function TabsContent(props: TabsContentProps) {
	return <TabsPrimitive.Panel {...stylex.props(styles.content)} {...props} />
}
