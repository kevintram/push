import { type LucideIcon } from 'lucide-react'

import { Button, type ButtonIconProps } from '~/components/ui'
import { appSidebar, iconWeights } from '~/styles/tokens.stylex'

export interface SidebarIconButtonProps extends Omit<
	ButtonIconProps,
	'children' | 'shape' | 'size' | 'variant'
> {
	icon: LucideIcon
}

// A small button is as tall as a sidebar row, so its glyph lines up with the
// rows' leading icons.
export function SidebarIconButton({
	icon: Icon,
	...props
}: SidebarIconButtonProps) {
	return (
		<Button.Icon {...props} shape='round' size='small' variant='ghost'>
			<Icon
				aria-hidden='true'
				size={appSidebar.iconSize}
				strokeWidth={iconWeights.medium}
			/>
		</Button.Icon>
	)
}
