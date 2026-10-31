import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible'
import * as stylex from '@stylexjs/stylex'

export interface CollapsibleTriggerProps extends Omit<
	React.ComponentProps<typeof CollapsiblePrimitive.Trigger>,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

export function CollapsibleTrigger({
	xstyle,
	...props
}: CollapsibleTriggerProps) {
	return (
		<CollapsiblePrimitive.Trigger
			data-slot='collapsible-trigger'
			{...stylex.props(xstyle)}
			{...props}
		/>
	)
}
