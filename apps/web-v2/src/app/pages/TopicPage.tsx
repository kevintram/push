import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
	useLocation,
	useNavigate,
	useParams,
	useRouter,
} from '@tanstack/react-router'
import { Ellipsis, Plus, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'

import { ContentColumn } from '~/components/ContentColumn'
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
import { colors } from '~/styles/colors.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	spacing,
} from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		padding: spacing.xl,
		gap: spacing.md,

		display: 'flex',
		flexDirection: 'column',
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
	pending: {
		paddingBlock: spacing.lg,
		color: colors.textSecondary,
	},
})

export function TopicPage() {
	const { topicId } = useParams({ from: '/library/$topicId' })
	const navigate = useNavigate()
	const router = useRouter()
	const shouldFocusTitle = useLocation({
		select: location =>
			(
				location.state as typeof location.state & {
					focusTopicTitle?: boolean
				}
			).focusTopicTitle === true,
	})

	const { data: topic } = useSuspenseQuery(topicQueries.detail(topicId))
	const { data: reviewCards } = useSuspenseQuery(
		reviewCardQueries.list({ topicId }),
	)
	const { mutate: updateTopic } = useUpdateTopic()
	const { isPending: isDeletingTopic, mutate: deleteTopic } = useDeleteTopic()
	const {
		isPending: isCreatingReviewCard,
		mutate: createReviewCard,
		variables: createReviewCardVariables,
	} = useCreateReviewCard()
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	const saveTitle = useCallback(
		(title: string) => {
			if (title === topic.title) return
			updateTopic({ id: topic.id, title })
		},
		[topic, updateTopic],
	)

	const saveBody = useCallback(
		(body: string) => {
			if (body === topic.body) return
			updateTopic({ id: topic.id, body })
		},
		[topic, updateTopic],
	)

	const title = useAutoSave({
		initialValue: topic.title,
		onSave: saveTitle,
		key: `topic-title-${topic.id}`,
	})
	const body = useAutoSave({
		initialValue: topic.body,
		onSave: saveBody,
		key: `topic-body-${topic.id}`,
	})

	const addReviewCard = () => {
		const sourceHref = router.state.location.href
		createReviewCard(
			{ topicId },
			{
				onSuccess: reviewCard => {
					if (router.state.location.href !== sourceHref) return
					void navigate({
						to: '/review-cards/$reviewCardId',
						params: {
							reviewCardId: reviewCard.id,
						},
					})
				},
			},
		)
	}

	const confirmDeleteTopic = () => {
		setIsDeleteDialogOpen(false)
		deleteTopic(topic.id)
		if (topic.parentId === undefined) {
			void navigate({ to: '/library' })
			return
		}
		void navigate({
			to: '/library/$topicId',
			params: { topicId: topic.parentId },
		})
	}

	return (
		<ContentColumn xstyle={styles.container}>
			<header {...stylex.props(styles.header)}>
				<div {...stylex.props(styles.titleBar)}>
					<Textarea
						aria-label='Topic title'
						autoFocus={shouldFocusTitle}
						placeholder='Title'
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
									shape='round'
									variant='ghost'
								/>
							}
						>
							<Ellipsis aria-hidden='true' />
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							<DropdownMenuItem
								disabled={isDeletingTopic}
								onClick={() => setIsDeleteDialogOpen(true)}
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
				<Textarea
					aria-label='Topic body'
					placeholder='Add a description…'
					value={body.value}
					onChange={body.onChange}
					onBlur={body.flush}
					xstyle={styles.body}
				/>
			</header>

			<div {...stylex.props(styles.reviewCardsHeaderContainer)}>
				<h2 {...stylex.props(styles.reviewCardsHeaderText)}>
					Review Cards
				</h2>
				<Button.Icon
					aria-label='Add review card'
					disabled={isCreatingReviewCard}
					shape='round'
					onClick={addReviewCard}
				>
					<Plus aria-hidden='true' />
				</Button.Icon>
			</div>

			<div {...stylex.props(styles.reviewCardsList)}>
				{reviewCards.map(reviewCard => (
					<ReviewCard key={reviewCard.id} {...reviewCard} />
				))}
				{isCreatingReviewCard &&
				createReviewCardVariables?.topicId === topicId ? (
					<p aria-disabled='true' {...stylex.props(styles.pending)}>
						Creating review card…
					</p>
				) : null}
			</div>

			<DeleteConfirmationDialog
				description='This will delete this topic, its subtopics, and all linked review cards and reviews.'
				isPending={isDeletingTopic}
				onConfirm={confirmDeleteTopic}
				onOpenChange={setIsDeleteDialogOpen}
				open={isDeleteDialogOpen}
				title='Delete topic?'
			/>
		</ContentColumn>
	)
}
