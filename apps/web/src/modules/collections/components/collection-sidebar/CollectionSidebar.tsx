import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'

import { breakpoints, spacing } from '~/styles/tokens.stylex'

import { SubcollectionsPanel } from './SubcollectionsPanel'

const styles = stylex.create({
	container: {
		gap: spacing.sm,
		display: {
			default: 'none',
			[breakpoints.tablet]: 'flex',
		},
		flexDirection: 'column',
		flexShrink: 0,
		inlineSize: '320px',
		maxBlockSize: '100%',
		minBlockSize: 0,
	},
})

type CollectionSidebarProps = {
	collectionId: Id<'collections'>
}

export function CollectionSidebar({ collectionId }: CollectionSidebarProps) {
	return (
		<aside
			aria-label='Collection details'
			{...stylex.props(styles.container)}
		>
			<SubcollectionsPanel collectionId={collectionId} />
		</aside>
	)
}
