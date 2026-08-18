import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible'
import * as stylex from '@stylexjs/stylex'

export interface CollapsibleContentProps extends Omit<
	React.ComponentProps<typeof CollapsiblePrimitive.Panel>,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

export function CollapsibleContent({
	xstyle,
	...props
}: CollapsibleContentProps) {
	return (
		<CollapsiblePrimitive.Panel
			data-slot='collapsible-content'
			{...stylex.props(xstyle)}
			{...props}
		/>
	)
}
