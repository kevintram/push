import * as stylex from '@stylexjs/stylex'
import { useState } from 'react'

import { radii, spacing } from '~/styles/tokens.stylex'

import { Collapsible, type CollapsibleProps } from '../Collapsible'
import { TreeItemContext } from './TreeItemContext'

export interface TreeItemProps extends Omit<
	CollapsibleProps,
	'defaultOpen' | 'onOpenChange' | 'open' | 'render' | 'xstyle'
> {
	defaultExpanded?: boolean
	expandable?: boolean
	expanded?: boolean
	label: string
	onExpandedChange?: CollapsibleProps['onOpenChange']
	selected?: boolean
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	root: {
		borderRadius: radii.lg,
		gap: spacing.xs,
		display: 'flex',
		flexDirection: 'column',
	},
})

export function TreeItem({
	defaultExpanded = true,
	expandable = false,
	expanded: controlledExpanded,
	label,
	onExpandedChange,
	selected = false,
	xstyle,
	...props
}: TreeItemProps) {
	const [uncontrolledExpanded, setUncontrolledExpanded] =
		useState(defaultExpanded)
	const expanded = expandable && (controlledExpanded ?? uncontrolledExpanded)

	const handleExpandedChange: NonNullable<
		CollapsibleProps['onOpenChange']
	> = (nextExpanded, eventDetails) => {
		if (controlledExpanded === undefined) {
			setUncontrolledExpanded(nextExpanded)
		}

		onExpandedChange?.(nextExpanded, eventDetails)
	}

	return (
		<TreeItemContext value={{ expandable, expanded, label, selected }}>
			<Collapsible
				open={expanded}
				onOpenChange={handleExpandedChange}
				render={<li />}
				xstyle={[styles.root, xstyle]}
				data-slot='tree-item'
				{...props}
			/>
		</TreeItemContext>
	)
}
