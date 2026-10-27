import * as stylex from '@stylexjs/stylex'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { appSidebar, spacing } from '~/styles/tokens.stylex'

import {
	CollapsibleContent,
	type CollapsibleContentProps,
} from '../Collapsible'
import { treeMarker } from './tree.stylex'
import { useTreeItemContext } from './TreeItemContext'

export interface TreeItemChildrenProps extends Omit<
	CollapsibleContentProps,
	'render' | 'xstyle'
> {
	xstyle?: stylex.StyleXStyles
}

// Lines the indent guide up under the parent row's chevron. It starts on a
// whole pixel, since a half-pixel offset blurs the 1px line on 1x displays.
const guideOffset = `calc(${appSidebar.rowInset} + ${appSidebar.iconSize} / 2)`

const styles = stylex.create({
	children: {
		margin: 0,
		gap: 0,
		paddingBlock: 0,
		// The indent guide, emphasized on the branch holding the selected item.
		backgroundImage: {
			default: `linear-gradient(${colorsSemantic.borderSubtle}, ${colorsSemantic.borderSubtle})`,
			':has(> li > [data-slot="tree-item-content"][data-selected])': `linear-gradient(${colorsSemantic.borderPrimary}, ${colorsSemantic.borderPrimary})`,
		},
		backgroundPositionX: guideOffset,
		backgroundRepeat: 'no-repeat',
		// Hidden until the tree is hovered or keyboard-focused. Devices without
		// hover always show it.
		backgroundSize: {
			default: '1px 100%',
			'@media (hover: hover)': {
				default: '0 100%',
				[stylex.when.ancestor(':has(:focus-visible)', treeMarker)]:
					'1px 100%',
				[stylex.when.ancestor(':hover', treeMarker)]: '1px 100%',
			},
		},
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
