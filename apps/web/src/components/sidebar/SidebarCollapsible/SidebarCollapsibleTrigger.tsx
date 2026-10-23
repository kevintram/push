import * as stylex from '@stylexjs/stylex'
import { ChevronDown } from 'lucide-react'

import { CollapsibleTrigger } from '~/components/ui'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
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
		paddingBlock: 0,
		paddingInline: appSidebar.rowInset,

		borderRadius: radii.lg,
		alignItems: 'center',
		backgroundColor: 'transparent',
		blockSize: appSidebar.rowHeight,
		color: {
			default: colorsSemantic.textInteractive,
			':disabled': colorsSemantic.textInteractiveDisabled,
			':hover': colorsSemantic.textInteractiveHover,
			':active': colorsSemantic.textInteractiveActive,
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
	content: {
		gap: spacing.xs,
		alignItems: 'baseline',
		display: 'flex',
		minInlineSize: 0,
	},
	chevron: {
		blockSize: appSidebar.iconSize,
		flexShrink: 0,
		inlineSize: appSidebar.iconSize,
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
					<span {...stylex.props(styles.content)}>
						<span>{children}</span>
						<ChevronDown
							aria-hidden='true'
							{...stylex.props(
								styles.chevron,
								!open && styles.chevronCollapsed,
							)}
							strokeWidth={iconWeights.medium}
						/>
					</span>
				</button>
			)}
			xstyle={[styles.trigger, xstyle]}
			{...props}
		/>
	)
}
