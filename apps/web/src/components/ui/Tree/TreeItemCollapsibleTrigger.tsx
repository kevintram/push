import * as stylex from '@stylexjs/stylex'
import { ChevronRight } from 'lucide-react'

import { appSidebar } from '~/styles/tokens.stylex'

import { Button } from '../Button/Button'
import {
	CollapsibleTrigger,
	type CollapsibleTriggerProps,
} from '../Collapsible'
import { useTreeItemContext } from './TreeItemContext'

export type TreeItemCollapsibleTriggerProps = Omit<
	CollapsibleTriggerProps,
	'aria-label' | 'children' | 'render' | 'xstyle'
> & {
	/** A stable accessible name for the toggle button. */
	'aria-label': string
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	placeholder: {
		blockSize: appSidebar.iconSize,
		inlineSize: appSidebar.iconSize,
	},
	chevronButton: {
		justifySelf: 'center',
	},
	chevron: {
		transform: 'rotate(0deg)',
		transitionDuration: {
			default: '125ms',
			'@media (prefers-reduced-motion: reduce)': '1ms',
		},
		transitionProperty: 'transform',
		transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
	},
	chevronOpen: {
		transform: 'rotate(90deg)',
	},
})

export function TreeItemCollapsibleTrigger({
	xstyle,
	...props
}: TreeItemCollapsibleTriggerProps) {
	const { collapsible } = useTreeItemContext()

	if (!collapsible) {
		return (
			<span
				aria-hidden='true'
				data-slot='tree-item-collapsible-placeholder'
				{...stylex.props(styles.placeholder, xstyle)}
			/>
		)
	}

	return (
		<CollapsibleTrigger
			{...props}
			render={(renderProps, { open }) => (
				<Button.Icon
					{...renderProps}
					shape='round'
					size='micro'
					variant='ghost'
					xstyle={[styles.chevronButton, xstyle]}
				>
					<ChevronRight
						aria-hidden='true'
						size={appSidebar.iconSize}
						{...stylex.props(
							styles.chevron,
							open && styles.chevronOpen,
						)}
					/>
				</Button.Icon>
			)}
		/>
	)
}
