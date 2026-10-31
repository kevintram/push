import * as stylex from '@stylexjs/stylex'
import { MoreHorizontal } from 'lucide-react'

import { iconSizes, spacing } from '~/styles/tokens.stylex'

import { Button, type ButtonProps } from '../Button/Button'

export interface BreadcrumbEllipsisProps extends Omit<
	ButtonProps,
	'children' | 'iconOnly' | 'size' | 'variant'
> {
	/** Names the hidden items, e.g. "Show hidden collections". */
	'aria-label': string
}

const styles = stylex.create({
	// Pulls the hitbox partway into the list gap so the glyph sits closer to
	// its separators while the focus ring still clears them.
	ellipsis: {
		marginInline: `calc(${spacing['2xs']} * -1)`,
	},
	icon: {
		blockSize: iconSizes.sm,
		inlineSize: iconSizes.sm,
	},
})

// BreadcrumbEllipsis stands in for hidden items. Pass it as a menu trigger's
// `render` prop.
export function BreadcrumbEllipsis({
	xstyle,
	...props
}: BreadcrumbEllipsisProps) {
	return (
		<Button
			data-slot='breadcrumb-ellipsis'
			iconOnly
			size='micro'
			variant='ghost'
			xstyle={[styles.ellipsis, xstyle]}
			{...props}
		>
			<MoreHorizontal aria-hidden='true' {...stylex.props(styles.icon)} />
		</Button>
	)
}
