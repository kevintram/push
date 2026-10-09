import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useCallback, useMemo } from 'react'

import { Button } from '~/components/ui'
import { subcollectionsPanelColors } from '~/styles/colors/components.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

import {
	collectionQueries,
	useCreateCollection,
} from '../../api/collectionQueries'
import { SubcollectionItem } from './SubcollectionItem'

const styles = stylex.create({
	container: {
		padding: spacing.lg,
		borderRadius: radii.xl,
		backgroundColor: subcollectionsPanelColors.containerBackground,
		display: 'block',
		flexShrink: 1,
		minBlockSize: 0,
		overflowY: 'auto',
	},
	header: {
		alignItems: 'center',
		display: 'flex',
		paddingBlockEnd: spacing.sm,
	},
	title: {
		margin: 0,
		color: subcollectionsPanelColors.titleForeground,
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		fontSize: fontSizes.md,
		fontWeight: fontWeights.medium,
	},
	list: { display: 'flex', flexDirection: 'column' },
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
						to: '/library/$collectionId',
						params: { collectionId: newCollectionId },
					}),
			},
		)
	}, [createCollection, navigate, collectionId])

	return (
		<section
			aria-label='Subcollections'
			{...stylex.props(styles.container)}
		>
			<div {...stylex.props(styles.header)}>
				<p {...stylex.props(styles.title)}>Subcollections</p>
				<Button.Icon
					aria-label='Add subcollection'
					variant='ghost'
					size='micro'
					disabled={createCollection.isPending}
					onClick={handleCreateSubcollection}
					shape='round'
				>
					<Plus aria-hidden='true' size={iconSizes.sm} />
				</Button.Icon>
			</div>
			<div {...stylex.props(styles.list)}>
				{subcollections.map(subcollection => (
					<SubcollectionItem
						key={subcollection._id}
						collection={subcollection}
					/>
				))}
			</div>
		</section>
	)
}
