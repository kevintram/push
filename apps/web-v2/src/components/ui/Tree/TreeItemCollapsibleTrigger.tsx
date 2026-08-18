import * as stylex from '@stylexjs/stylex'
import { ChevronRight } from 'lucide-react'

import { iconSizes } from '~/styles/tokens.stylex'

import { Button } from '../Button/Button'
import {
	CollapsibleTrigger,
	type CollapsibleTriggerProps,
} from '../Collapsible'
import { useTreeItemContext } from './TreeItemContext'

export interface TreeItemCollapsibleTriggerProps extends Omit<
	CollapsibleTriggerProps,
	'children' | 'render' | 'xstyle'
> {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	placeholder: {
		blockSize: '26px',
		inlineSize: '26px',
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
	chevronExpanded: {
		transform: 'rotate(90deg)',
	},
})

export function TreeItemCollapsibleTrigger({
	'aria-label': ariaLabel,
	xstyle,
	...props
}: TreeItemCollapsibleTriggerProps) {
	const { expandable, expanded, label } = useTreeItemContext()

	if (!expandable) {
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
			render={
				<Button.Icon
					aria-label={
						ariaLabel ??
						`${expanded ? 'Collapse' : 'Expand'} ${label}`
					}
					shape='round'
					size='micro'
					variant='ghost'
					xstyle={xstyle}
				/>
			}
		>
			<ChevronRight
				aria-hidden='true'
				size={iconSizes.md}
				{...stylex.props(
					styles.chevron,
					expanded && styles.chevronExpanded,
				)}
			/>
		</CollapsibleTrigger>
	)
}
