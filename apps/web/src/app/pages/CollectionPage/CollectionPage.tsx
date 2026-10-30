import type { Collection } from '@convex/validators/collections'
import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { Ellipsis } from 'lucide-react'
import { useCallback, useState } from 'react'

import {
	BreadcrumbItem,
	BreadcrumbPage,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Textarea,
} from '~/components/ui'
import { useAutoSave } from '~/hooks/useAutoSave'
import {
	collectionQueries,
	useDeleteCollection,
	useUpdateCollection,
} from '~/modules/collections/api/collectionQueries'
import { CollectionPathBreadcrumbs } from '~/modules/collections/components/CollectionPathBreadcrumbs'
import { MoveCollectionDialog } from '~/modules/collections/components/MoveCollectionDialog'
import { SubcollectionsPanel } from '~/modules/collections/components/subcollections/SubcollectionsPanel'
import { formatBreadcrumbLabel } from '~/modules/collections/utils/formatBreadcrumbLabel'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { scrollFade } from '~/styles/scrollFade'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	layout,
	spacing,
} from '~/styles/tokens.stylex'

import { CollectionCards } from './CollectionCards'

const styles = stylex.create({
	container: {
		overflow: 'hidden',
		blockSize: '100%',
		display: 'flex',
		flexDirection: 'column',
		minHeight: 0,
		width: '100%',
	},
	toolbar: {
		gap: spacing.md,
		paddingBlock: layout.topBarInset,
		paddingInline: spacing.lg,
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
		justifyContent: 'space-between',
	},
	breadcrumbs: {
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		minWidth: 0,
	},
	toolbarActions: { flexShrink: 0 },
	body: {
		gap: spacing.lg,
		overflow: 'hidden',
		paddingInline: spacing.lg,
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		paddingBlockEnd: spacing.lg,
		minHeight: 0,
		minWidth: 0,
	},
	scrollArea: {
		overflow: 'auto',
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		justifyContent: 'center',
		minHeight: 0,
		minWidth: 0,
	},
	content: {
		gap: spacing.xl,
		paddingInline: spacing.lg,
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 1,
		marginBlockStart: spacing.xl,
		maxWidth: `calc(${layout.contentColumnMaxWidth} + (${spacing.lg} * 2))`,
		minWidth: 0,
		width: '100%',
	},
	collectionDetails: {
		gap: spacing.xs,
		display: 'flex',
		flexDirection: 'column',
	},
	title: {
		fontSize: fontSizes['2xl'],
		fontWeight: fontWeights.semibold,
	},
	description: {
		color: colorsSemantic.textSecondary,
		fontSize: fontSizes.md,
	},
})

export function CollectionPage() {
	const { collectionId } = useParams({ from: '/collection/$collectionId' })
	const { data: collection } = useSuspenseQuery(
		collectionQueries.detail(collectionId, { expandPath: true }),
	)

	const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
	const deleteCollection = useDeleteCollection()
	const updateCollection = useUpdateCollection()

	const handleDeleteCollection = useCallback(() => {
		deleteCollection.mutate({ collectionId })
	}, [deleteCollection, collectionId])

	const saveTitle = useCallback(
		(title: string) => {
			if (title === collection.title) return

			updateCollection.mutate({ collectionId, title })
		},
		[collection, collectionId, updateCollection],
	)
	const saveDescription = useCallback(
		(description: string) => {
			if (description === collection.description) return

			updateCollection.mutate({ collectionId, description })
		},
		[collection, collectionId, updateCollection],
	)

	const title = useAutoSave({
		initialValue: collection.title,
		key: `${collectionId}:title`,
		onSave: saveTitle,
	})
	const description = useAutoSave({
		initialValue: collection.description,
		key: `${collectionId}:description`,
		onSave: saveDescription,
	})

	return (
		<div {...stylex.props(styles.container)}>
			<header {...stylex.props(styles.toolbar)}>
				<div {...stylex.props(styles.breadcrumbs)}>
					<CollectionPathBreadcrumbs
						collections={collection.path as Array<Collection>}
					>
						<BreadcrumbItem>
							<BreadcrumbPage>
								{formatBreadcrumbLabel(title.value)}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</CollectionPathBreadcrumbs>
				</div>
				<div {...stylex.props(styles.toolbarActions)}>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									aria-label='Collection actions'
									iconOnly
									shape='round'
									size='small'
									variant='ghost'
								/>
							}
						>
							<Ellipsis aria-hidden='true' size={iconSizes.sm} />
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							<DropdownMenuItem
								onClick={() => setIsMoveDialogOpen(true)}
							>
								Move
							</DropdownMenuItem>
							<DropdownMenuItem
								disabled={deleteCollection.isPending}
								onClick={handleDeleteCollection}
							>
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</header>

			{isMoveDialogOpen ? (
				<MoveCollectionDialog
					onOpenChange={setIsMoveDialogOpen}
					parentId={collection.parentId}
					collectionId={collection._id}
				/>
			) : null}

			<div {...stylex.props(styles.body)}>
				<div {...stylex.props(styles.scrollArea, scrollFade.y)}>
					<div {...stylex.props(styles.content)}>
						<section {...stylex.props(styles.collectionDetails)}>
							<Textarea
								placeholder='Title'
								aria-label='Collection title'
								onBlur={title.flush}
								onChange={title.onChange}
								value={title.value}
								xstyle={styles.title}
							/>
							<Textarea
								placeholder='Add description...'
								aria-label='Collection description'
								onBlur={description.flush}
								onChange={description.onChange}
								value={description.value}
								xstyle={styles.description}
							/>
						</section>

						<SubcollectionsPanel collectionId={collectionId} />

						<CollectionCards collectionId={collectionId} />
					</div>
				</div>
			</div>
		</div>
	)
}
