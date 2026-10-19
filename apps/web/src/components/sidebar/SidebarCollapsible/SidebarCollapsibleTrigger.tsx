import * as stylex from '@stylexjs/stylex'
import { ChevronDown } from 'lucide-react'

import { CollapsibleTrigger } from '~/components/ui'
import { semanticColors } from '~/styles/colors/semantic.stylex'
import {
	appSidebar,
	fontSizes,
	fontWeights,
	iconWeights,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

const styles = stylex.create({
	trigger: {
		borderWidth: 0,
		gap: spacing.xs,
		paddingBlock: 0,
		paddingInline: appSidebar.rowInset,

		borderRadius: radii.lg,
		alignItems: 'center',
		backgroundColor: 'transparent',
		blockSize: appSidebar.rowHeight,
		color: {
			default: semanticColors.textInteractive,
			':disabled': semanticColors.textInteractiveDisabled,
			':hover': semanticColors.textInteractiveHover,
			':active': semanticColors.textInteractiveActive,
		},
		cursor: 'pointer',
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		fontFamily: 'inherit',
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
		minInlineSize: 0,
		textAlign: 'start',
	},
	chevron: {
		blockSize: appSidebar.iconSize,
		flexShrink: 0,
		inlineSize: appSidebar.iconSize,
		opacity: {
			default: 0,
			[stylex.when.ancestor(':focus-within')]: 1,
			[stylex.when.ancestor(':hover')]: 1,
		},
	},
	chevronCollapsed: {
		transform: 'rotate(-90deg)',
	},
})

export interface SidebarCollapsibleTriggerProps extends Omit<
	React.ComponentProps<typeof CollapsibleTrigger>,
	'children' | 'className' | 'style' | 'render' | 'aria-label'
> {
	children: string
	xstyle?: stylex.StyleXStyles
}

export function SidebarCollapsibleTrigger({
	children,
	xstyle,
	...props
}: SidebarCollapsibleTriggerProps) {
	return (
		<CollapsibleTrigger
			render={(renderProps, { open }) => (
				<button
					{...renderProps}
					aria-label={`${open ? 'Collapse' : 'Expand'} ${children}`}
					type='button'
				>
					<span>{children}</span>
					<ChevronDown
						aria-hidden='true'
						{...stylex.props(
							styles.chevron,
							!open && styles.chevronCollapsed,
						)}
						strokeWidth={iconWeights.medium}
					/>
				</button>
			)}
			xstyle={[styles.trigger, xstyle]}
			{...props}
		/>
	)
}
