import * as stylex from '@stylexjs/stylex'
import { type LucideIcon } from 'lucide-react'

import { Button, type ButtonProps } from '~/components/ui'
import {
	appSidebar,
	fontSizes,
	fontWeights,
	iconWeights,
} from '~/styles/tokens.stylex'

const styles = stylex.create({
	labeled: {
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
	},
})

export interface SidebarActionProps extends Omit<
	ButtonProps,
	'children' | 'iconOnly' | 'shape' | 'size' | 'variant'
> {
	icon: LucideIcon
	/**
	 * Visible text before the icon. Toggling it keeps the same element, so
	 * focus stays on the button.
	 */
	label?: string
}

// A sidebar control that acts in place. Places to go use SidebarItem.
//
// A small button is as tall as a sidebar row, so its glyph lines up with the
// rows' leading icons.
export function SidebarAction({
	icon: Icon,
	label,
	xstyle,
	...props
}: SidebarActionProps) {
	return (
		<Button
			{...props}
			iconOnly={!label}
			shape='round'
			size='small'
			variant='ghost'
			xstyle={[!!label && styles.labeled, xstyle]}
		>
			{label}
			<Icon
				aria-hidden='true'
				size={appSidebar.iconSize}
				strokeWidth={iconWeights.medium}
			/>
		</Button>
	)
}
