import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useCallback } from 'react'

import { Panel } from '~/components/Panel'
import { Button } from '~/components/ui'
import { iconSizes, spacing } from '~/styles/tokens.stylex'

import {
	collectionQueries,
	useCreateCollection,
} from '../../api/collectionQueries'
import { SubcollectionItem } from './SubcollectionItem'

const styles = stylex.create({
	// Bleeds into the page gutter so the panel's text lines up with the page's.
	panel: {
		marginInline: `calc(${spacing.lg} * -1)`,
	},
	list: {
		gap: spacing.md,
		alignItems: 'center',
		display: 'flex',
		flexWrap: 'wrap',
	},
})

type SubcollectionsPanelProps = {
	collectionId: Id<'collections'>
}

export function SubcollectionsPanel({
	collectionId,
}: SubcollectionsPanelProps) {
	const { data: subcollections } = useSuspenseQuery(
		collectionQueries.children(collectionId),
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
		<Panel
			title='Subcollections'
			actions={
				<Button
					aria-label='Add subcollection'
					variant='ghost'
					size='micro'
					disabled={createCollection.isPending}
					onClick={handleCreateSubcollection}
					shape='round'
				>
					<Plus aria-hidden='true' size={iconSizes.sm} />
					Add
				</Button>
			}
			xstyle={styles.panel}
		>
			<div {...stylex.props(styles.list)}>
				{subcollections.map(subcollection => (
					<SubcollectionItem
						key={subcollection._id}
						collection={subcollection}
					/>
				))}
			</div>
		</Panel>
	)
}
