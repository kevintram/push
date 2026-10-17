import type { Collection } from '@convex/validators/collections'
import * as stylex from '@stylexjs/stylex'
import { queryOptions, useSuspenseQueries } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { Ellipsis, FolderInput, Plus, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Separator,
	Textarea,
} from '~/components/ui'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useToday } from '~/hooks/useToday'
import {
	collectionQueries,
	useDeleteCollection,
	useUpdateCollection,
} from '~/modules/library/api/collectionQueries'
import { CollectionSidebar } from '~/modules/library/components/collection-sidebar/CollectionSidebar'
import { CollectionPathBreadcrumbs } from '~/modules/library/components/CollectionPathBreadcrumbs'
import { MoveCollectionDialog } from '~/modules/library/components/MoveCollectionDialog'
import { cardQueries, useCreateCard } from '~/modules/reviews/api/cardQueries'
import { CardItemLink } from '~/modules/reviews/components/CardItemLink'
import { deriveCardSrsState } from '~/modules/reviews/utils/cardSrs'
import { baseColors } from '~/styles/colors/primitives.stylex'
import { semanticColors } from '~/styles/colors/semantic.stylex'
import { scrollFade } from '~/styles/scrollFade'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	layout,
	spacing,
} from '~/styles/tokens.stylex'

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
		gap: spacing.md,
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
		gap: spacing.sm,
		display: 'flex',
		flexDirection: 'column',
	},
	title: {
		fontSize: fontSizes.xl,
		fontWeight: fontWeights.bold,
		minBlockSize: '44px',
	},
	description: { fontSize: fontSizes.md },
	separator: {
		marginBlock: spacing.md,
	},
	cardsHeaderText: {
		color: semanticColors.textSecondary,
		fontSize: fontSizes.md,
	},
	cardsList: {
		display: 'flex',
		flexDirection: 'column',
	},
	addCardButton: {
		backgroundColor: baseColors.transparent,
		inlineSize: '100%',
	},
})

export function CollectionPage() {
	const { collectionId } = useParams({ from: '/library/$collectionId' })
	const [{ data: collection }, { data: cards }] = useSuspenseQueries({
		queries: [
			queryOptions(
				collectionQueries.detail(collectionId, { expandPath: true }),
			),
			queryOptions(cardQueries.listByCollection(collectionId)),
		],
	})

	const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
	const deleteCollection = useDeleteCollection()
	const updateCollection = useUpdateCollection()
	const createCard = useCreateCard()
	const navigate = useNavigate()
	const today = useToday()

	const handleDeleteCollection = useCallback(() => {
		deleteCollection.mutate({ collectionId })
	}, [deleteCollection, collectionId])

	const handleCreateCard = useCallback(() => {
		createCard.mutate(
			{ collectionId },
			{
				onError: () => toast.error('Failed to create card'),
				onSuccess: cardId =>
					void navigate({
						to: '/cards/$cardId',
						params: { cardId },
					}),
			},
		)
	}, [createCard, navigate, collectionId])

	const saveTitle = useCallback(
		async (title: string) => {
			if (title === collection.title) return

			try {
				await updateCollection.mutateAsync({ collectionId, title })
			} catch {
				toast.error('Failed to update collection title')
			}
		},
		[collection, collectionId, updateCollection],
	)
	const saveDescription = useCallback(
		async (description: string) => {
			if (description === collection.description) return

			try {
				await updateCollection.mutateAsync({
					collectionId,
					description,
				})
			} catch {
				toast.error('Failed to update collection description')
			}
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
						currentLabel={title.value}
					/>
				</div>
				<div {...stylex.props(styles.toolbarActions)}>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button.Icon
									aria-label='Collection actions'
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
								<FolderInput
									aria-hidden='true'
									size={iconSizes.sm}
								/>
								Move
							</DropdownMenuItem>
							<DropdownMenuItem
								disabled={deleteCollection.isPending}
								onClick={handleDeleteCollection}
							>
								<Trash2
									aria-hidden='true'
									size={iconSizes.sm}
								/>
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

						<Separator xstyle={styles.separator} />

						<h2 {...stylex.props(styles.cardsHeaderText)}>Cards</h2>

						<div {...stylex.props(styles.cardsList)}>
							{cards.map(card => (
								<CardItemLink
									key={card._id}
									card={card}
									srs={deriveCardSrsState(card, today)}
									today={today}
								/>
							))}
							<Button
								aria-label='Add card'
								shape='round'
								variant='ghost'
								disabled={createCard.isPending}
								onClick={handleCreateCard}
								xstyle={styles.addCardButton}
							>
								<Plus size={iconSizes.sm} />
								Add card
							</Button>
						</div>
					</div>
				</div>

				<CollectionSidebar collectionId={collectionId} />
			</div>
		</div>
	)
}
