import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible'
import * as stylex from '@stylexjs/stylex'

export interface CollapsibleProps extends Omit<
	React.ComponentProps<typeof CollapsiblePrimitive.Root>,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

export function Collapsible({ xstyle, ...props }: CollapsibleProps) {
	return (
		<CollapsiblePrimitive.Root
			data-slot='collapsible'
			{...stylex.props(xstyle)}
			{...props}
		/>
	)
}
