import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from '@tanstack/react-router'
import { Ellipsis, Plus, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Textarea,
} from '~/components/ui'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useDeleteTopic } from '~/modules/library/api/deleteTopic'
import { topicQueries } from '~/modules/library/api/queries'
import { useUpdateTopic } from '~/modules/library/api/updateTopic'
import { useCreateReviewCard } from '~/modules/reviews/api/createReviewCard'
import { reviewCardQueries } from '~/modules/reviews/api/queries'
import { ReviewCard } from '~/modules/reviews/components/ReviewCard'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		padding: spacing.xl,
		gap: spacing.md,

		display: 'flex',
		flexDirection: 'column',

		flexBasis: 0,
		flexGrow: '1',
		flexShrink: '1',
	},
	header: {
		display: 'flex',
		flexDirection: 'column',

		gap: spacing.sm,
	},
	titleBar: {
		display: 'flex',

		gap: spacing.sm,
		alignItems: 'center',
	},
	title: {
		fontSize: fontSizes.xl,
		fontWeight: fontWeights.bold,
		minBlockSize: '44px',
	},
	body: { fontSize: fontSizes.md },
	reviewCardsHeaderContainer: {
		display: 'flex',
	},
	reviewCardsHeaderText: {
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
	},
	reviewCardsList: {
		display: 'flex',
		flexDirection: 'column',
	},
})

export function TopicPage() {
	const { topicId } = useParams({ from: '/library/$topicId' })
	const navigate = useNavigate()
	const shouldFocusTitle = useLocation({
		select: location =>
			(
				location.state as typeof location.state & {
					focusTopicTitle?: boolean
				}
			).focusTopicTitle === true,
	})

	const { data: topic } = useQuery(topicQueries.detail(topicId))
	const { data: reviewCards } = useQuery(reviewCardQueries.list({ topicId }))
	const { mutateAsync: updateTopic } = useUpdateTopic()
	const { isPending: isDeletingTopic, mutateAsync: deleteTopic } =
		useDeleteTopic()
	const { isPending: isCreatingReviewCard, mutateAsync: createReviewCard } =
		useCreateReviewCard()
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	const saveTitle = useCallback(
		async (title: string) => {
			if (!topic || title === topic.title) return
			try {
				await updateTopic({ id: topic.id, title })
			} catch {
				toast.error('Failed to update topic title')
			}
		},
		[topic, updateTopic],
	)

	const saveBody = useCallback(
		async (body: string) => {
			if (!topic || body === topic.body) return
			try {
				await updateTopic({ id: topic.id, body })
			} catch {
				toast.error('Failed to update topic body')
			}
		},
		[topic, updateTopic],
	)

	const title = useAutoSave({
		initialValue: topic?.title ?? '',
		onSave: saveTitle,
		key: `topic-title-${topic?.id ?? topicId}`,
	})
	const body = useAutoSave({
		initialValue: topic?.body ?? '',
		onSave: saveBody,
		key: `topic-body-${topic?.id ?? topicId}`,
	})

	const addReviewCard = async () => {
		try {
			const reviewCard = await createReviewCard({ topicId })
			await navigate({
				to: '/review-cards/$reviewCardId',
				params: {
					reviewCardId: reviewCard.id,
				},
			})
		} catch {
			toast.error('Failed to create review card')
		}
	}

	const confirmDeleteTopic = async () => {
		if (!topic) return
		try {
			await deleteTopic(topic.id)
			setIsDeleteDialogOpen(false)
			if (topic.parentId === undefined) {
				await navigate({ to: '/library' })
				return
			}
			await navigate({
				to: '/library/$topicId',
				params: { topicId: topic.parentId },
			})
		} catch {
			toast.error('Failed to delete topic')
		}
	}

	return (
		<div {...stylex.props(styles.container)}>
			<header {...stylex.props(styles.header)}>
				{topic && (
					<>
						<div {...stylex.props(styles.titleBar)}>
							<Textarea
								aria-label='Topic title'
								autoFocus={shouldFocusTitle}
								placeholder='Topic title'
								value={title.value}
								onChange={title.onChange}
								onBlur={title.flush}
								xstyle={styles.title}
							/>
							<DropdownMenu>
								<DropdownMenuTrigger
									render={
										<Button.Icon
											aria-label='Topic actions'
											variant='ghost'
										/>
									}
								>
									<Ellipsis aria-hidden='true' />
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end'>
									<DropdownMenuItem
										disabled={isDeletingTopic}
										onClick={() =>
											setIsDeleteDialogOpen(true)
										}
									>
										<Trash2 aria-hidden='true' size={16} />
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
						<Textarea
							aria-label='Topic body'
							placeholder='Add a topic description'
							value={body.value}
							onChange={body.onChange}
							onBlur={body.flush}
							xstyle={styles.body}
						/>
					</>
				)}
			</header>

			<div {...stylex.props(styles.reviewCardsHeaderContainer)}>
				<h2 {...stylex.props(styles.reviewCardsHeaderText)}>
					Review Cards
				</h2>
				<Button.Icon
					aria-label='Add review card'
					disabled={isCreatingReviewCard}
					onClick={() => void addReviewCard()}
				>
					<Plus aria-hidden='true' />
				</Button.Icon>
			</div>

			<div {...stylex.props(styles.reviewCardsList)}>
				{reviewCards?.map(reviewCard => (
					<ReviewCard key={reviewCard.id} {...reviewCard} />
				))}
			</div>

			<DeleteConfirmationDialog
				description='This will delete this topic, its subtopics, and all linked review cards and reviews.'
				isPending={isDeletingTopic}
				onConfirm={() => void confirmDeleteTopic()}
				onOpenChange={setIsDeleteDialogOpen}
				open={isDeleteDialogOpen}
				title='Delete topic?'
			/>
		</div>
	)
}
