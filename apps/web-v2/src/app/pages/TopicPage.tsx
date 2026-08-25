import type { Topic } from '@convex/validators/topics'
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
	topicQueries,
	useDeleteTopic,
	useUpdateTopic,
} from '~/modules/library/api/topicQueries'
import { MoveTopicDialog } from '~/modules/library/components/MoveTopicDialog'
import { TopicBreadcrumbs } from '~/modules/library/components/TopicBreadcrumbs'
import {
	reviewCardQueries,
	useCreateReviewCard,
} from '~/modules/reviews/api/reviewCardQueries'
import { ReviewCardItem } from '~/modules/reviews/components/ReviewCardItem'
import { deriveReviewCardSrsState } from '~/modules/reviews/utils/reviewCardSrs'
import { semanticColors } from '~/styles/colors/semantic.stylex'
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
		paddingBlock: spacing.sm,
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
	scrollArea: {
		overflow: 'auto',
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		justifyContent: 'center',
		minHeight: 0,
		width: '100%',
	},
	content: {
		gap: spacing.md,
		marginInline: spacing.lg,
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 1,
		marginBlockStart: spacing.xl,
		maxWidth: layout.contentColumnMaxWidth,
		minWidth: 0,
		width: '100%',
	},
	topicDetails: {
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
	reviewCardsHeaderText: {
		color: semanticColors.textSecondary,
		fontSize: fontSizes.md,
	},
	reviewCardsList: {
		display: 'flex',
		flexDirection: 'column',
	},
	addReviewCardButton: {
		inlineSize: '100%',
	},
})

export function TopicPage() {
	const { topicId } = useParams({ from: '/library/$topicId' })
	const [{ data: topic }, { data: reviewCards }] = useSuspenseQueries({
		queries: [
			queryOptions(topicQueries.detail(topicId, { expandPath: true })),
			queryOptions(reviewCardQueries.listByTopic(topicId)),
		],
	})

	const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
	const deleteTopic = useDeleteTopic()
	const updateTopic = useUpdateTopic()
	const createReviewCard = useCreateReviewCard()
	const navigate = useNavigate()
	const today = useToday()

	const handleDeleteTopic = useCallback(() => {
		deleteTopic.mutate({ topicId })
	}, [deleteTopic, topicId])

	const handleCreateReviewCard = useCallback(() => {
		createReviewCard.mutate(
			{ topicId },
			{
				onError: () => toast.error('Failed to create review card'),
				onSuccess: reviewCardId =>
					void navigate({
						to: '/review-cards/$reviewCardId',
						params: { reviewCardId },
					}),
			},
		)
	}, [createReviewCard, navigate, topicId])

	const saveTitle = useCallback(
		async (title: string) => {
			if (title === topic.title) return

			try {
				await updateTopic.mutateAsync({ topicId, title })
			} catch {
				toast.error('Failed to update topic title')
			}
		},
		[topic, topicId, updateTopic],
	)
	const saveDescription = useCallback(
		async (description: string) => {
			if (description === topic.description) return

			try {
				await updateTopic.mutateAsync({ topicId, description })
			} catch {
				toast.error('Failed to update topic description')
			}
		},
		[topic, topicId, updateTopic],
	)

	const title = useAutoSave({
		initialValue: topic.title,
		key: `${topicId}:title`,
		onSave: saveTitle,
	})
	const description = useAutoSave({
		initialValue: topic.description,
		key: `${topicId}:description`,
		onSave: saveDescription,
	})

	return (
		<div {...stylex.props(styles.container)}>
			<header {...stylex.props(styles.toolbar)}>
				<div {...stylex.props(styles.breadcrumbs)}>
					<TopicBreadcrumbs
						ancestors={topic.path as Array<Topic>}
						currentTitle={title.value}
					/>
				</div>
				<div {...stylex.props(styles.toolbarActions)}>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button.Icon
									aria-label='Topic actions'
									shape='round'
									variant='ghost'
								/>
							}
						>
							<Ellipsis aria-hidden='true' size={iconSizes.md} />
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							<DropdownMenuItem
								onClick={() => setIsMoveDialogOpen(true)}
							>
								<FolderInput
									aria-hidden='true'
									size={iconSizes.md}
								/>
								Move
							</DropdownMenuItem>
							<DropdownMenuItem
								disabled={deleteTopic.isPending}
								onClick={handleDeleteTopic}
							>
								<Trash2
									aria-hidden='true'
									size={iconSizes.md}
								/>
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</header>

			{isMoveDialogOpen ? (
				<MoveTopicDialog
					onOpenChange={setIsMoveDialogOpen}
					parentId={topic.parentId}
					topicId={topic._id}
				/>
			) : null}

			<div {...stylex.props(styles.scrollArea)}>
				<div {...stylex.props(styles.content)}>
					<section {...stylex.props(styles.topicDetails)}>
						<Textarea
							placeholder='Title'
							aria-label='Topic title'
							onBlur={title.flush}
							onChange={title.onChange}
							value={title.value}
							xstyle={styles.title}
						/>
						<Textarea
							placeholder='Add description...'
							aria-label='Topic description'
							onBlur={description.flush}
							onChange={description.onChange}
							value={description.value}
							xstyle={styles.description}
						/>
					</section>

					<Separator xstyle={styles.separator} />

					<h2 {...stylex.props(styles.reviewCardsHeaderText)}>
						Review Cards
					</h2>

					<div {...stylex.props(styles.reviewCardsList)}>
						{reviewCards.map(reviewCard => (
							<ReviewCardItem
								key={reviewCard._id}
								reviewCard={reviewCard}
								srs={deriveReviewCardSrsState(
									reviewCard,
									today,
								)}
								today={today}
							/>
						))}
						<Button
							aria-label='Add review card'
							shape='round'
							variant='ghost'
							disabled={createReviewCard.isPending}
							onClick={handleCreateReviewCard}
							xstyle={styles.addReviewCardButton}
						>
							<Plus size={iconSizes.md} />
							Add review card
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
