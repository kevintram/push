import * as stylex from '@stylexjs/stylex'

import { spacing } from '~/styles/tokens.stylex'

import {
	CollapsibleContent,
	type CollapsibleContentProps,
} from '../Collapsible'
import { useTreeItemContext } from './TreeItemContext'

export interface TreeItemChildrenProps extends Omit<
	CollapsibleContentProps,
	'render' | 'xstyle'
> {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	children: {
		margin: 0,
		gap: spacing.xs,
		paddingBlock: 0,
		display: {
			default: 'flex',
			':is([hidden])': 'none',
		},
		flexDirection: 'column',
		listStyleType: 'none',
		paddingInlineEnd: 0,
		paddingInlineStart: spacing.md,
	},
})

export function TreeItemChildren({
	keepMounted = true,
	xstyle,
	...props
}: TreeItemChildrenProps) {
	const { collapsible } = useTreeItemContext()

	if (!collapsible) return null

	return (
		<CollapsibleContent
			keepMounted={keepMounted}
			render={<ul />}
			xstyle={[styles.children, xstyle]}
			data-slot='tree-item-children'
			{...props}
		/>
	)
}
