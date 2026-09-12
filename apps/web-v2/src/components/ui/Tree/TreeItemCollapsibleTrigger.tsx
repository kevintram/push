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
	chevronOpen: {
		transform: 'rotate(90deg)',
	},
})

export function TreeItemCollapsibleTrigger({
	'aria-label': ariaLabel,
	xstyle,
	...props
}: TreeItemCollapsibleTriggerProps) {
	const { collapsible, label } = useTreeItemContext()

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
					aria-label={
						ariaLabel ?? `${open ? 'Collapse' : 'Expand'} ${label}`
					}
					shape='round'
					size='micro'
					variant='ghost'
					xstyle={xstyle}
				>
					<ChevronRight
						aria-hidden='true'
						size={iconSizes.md}
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
