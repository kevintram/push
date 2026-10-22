import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useCallback, useMemo } from 'react'

import { SidebarPanel } from '~/components/SidebarPanel'
import { Button } from '~/components/ui'
import { scrollFade } from '~/styles/scrollFade'
import { iconSizes, spacing } from '~/styles/tokens.stylex'

import {
	collectionQueries,
	useCreateCollection,
} from '../../api/collectionQueries'
import { SubcollectionItem } from './SubcollectionItem'

const styles = stylex.create({
	container: {
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 1,
		minBlockSize: 0,
	},
	list: {
		marginInline: `calc(${spacing.sm} * -1)`,
		// Items bleed into the panel padding on hover. The scroll container
		// clips horizontally, so give the list that padding back.
		paddingInline: spacing.sm,
		display: 'flex',
		flexDirection: 'column',
		minBlockSize: 0,
		overflowY: 'auto',
	},
})

type SubcollectionsPanelProps = {
	collectionId: Id<'collections'>
}

export function SubcollectionsPanel({
	collectionId,
}: SubcollectionsPanelProps) {
	// The full collection list is already loaded and subscribed by the library
	// route, so filtering it here costs nothing beyond the parent's own render.
	const { data: collections } = useSuspenseQuery(collectionQueries.list())
	const subcollections = useMemo(
		() =>
			collections.filter(
				collection => collection.parentId === collectionId,
			),
		[collections, collectionId],
	)

	const createCollection = useCreateCollection()
	const navigate = useNavigate()

	const handleCreateSubcollection = useCallback(() => {
		createCollection.mutate(
			{ parentId: collectionId },
			{
				onSuccess: newCollectionId =>
					void navigate({
						to: '/collection/$collectionId',
						params: { collectionId: newCollectionId },
					}),
			},
		)
	}, [createCollection, navigate, collectionId])

	return (
		<SidebarPanel
			title='Subcollections'
			actions={
				<Button
					aria-label='Add subcollection'
					iconOnly
					variant='ghost'
					size='micro'
					disabled={createCollection.isPending}
					onClick={handleCreateSubcollection}
					shape='round'
				>
					<Plus aria-hidden='true' size={iconSizes.sm} />
				</Button>
			}
			xstyle={styles.container}
		>
			<div {...stylex.props(styles.list, scrollFade.y)}>
				{subcollections.map(subcollection => (
					<SubcollectionItem
						key={subcollection._id}
						collection={subcollection}
					/>
				))}
			</div>
		</SidebarPanel>
	)
}
