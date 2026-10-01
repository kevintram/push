import type * as stylex from '@stylexjs/stylex'

import { CollapsibleContent } from '~/components/ui'

export interface SidebarCollapsibleContentProps extends Omit<
	React.ComponentProps<typeof CollapsibleContent>,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

export function SidebarCollapsibleContent({
	xstyle,
	...props
}: SidebarCollapsibleContentProps) {
	return <CollapsibleContent xstyle={xstyle} {...props} />
}
