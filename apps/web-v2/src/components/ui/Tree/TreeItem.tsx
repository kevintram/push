import * as stylex from '@stylexjs/stylex'

import { radii, spacing } from '~/styles/tokens.stylex'

import { Collapsible, type CollapsibleProps } from '../Collapsible'
import { TreeItemContext } from './TreeItemContext'

export interface TreeItemProps extends Omit<
	CollapsibleProps,
	'render' | 'xstyle'
> {
	collapsible?: boolean
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
	collapsible = false,
	defaultOpen = false,
	selected = false,
	xstyle,
	...props
}: TreeItemProps) {
	return (
		<TreeItemContext value={{ collapsible, selected }}>
			<Collapsible
				defaultOpen={defaultOpen}
				render={<li />}
				xstyle={[styles.root, xstyle]}
				data-slot='tree-item'
				{...props}
			/>
		</TreeItemContext>
	)
}
