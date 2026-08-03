import * as stylex from '@stylexjs/stylex'
import { queryOptions, useSuspenseQueries } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { Ellipsis, Plus, Trash2 } from 'lucide-react'
import { useCallback } from 'react'
import { toast } from 'sonner'

import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Textarea,
} from '~/components/ui'
import { useAutoSave } from '~/hooks/useAutoSave'
import { topicQueries, useDeleteTopic, useUpdateTopic } from '~/modules/library'
import {
	ReviewCard,
	reviewCardQueries,
	unscheduledSrsState,
	useCreateReviewCard,
} from '~/modules/reviews'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	layout,
	spacing,
} from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		display: 'flex',
		justifyContent: 'center',
		minHeight: '100%',
		width: '100%',

		overflow: 'auto',
	},
	content: {
		padding: spacing.xl,
		gap: spacing.md,
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 1,
		maxWidth: layout.contentMaxWidth,
		minWidth: 0,
		width: '100%',
	},
	header: { gap: spacing.sm, display: 'flex', flexDirection: 'column' },
	titleBar: { gap: spacing.sm, alignItems: 'center', display: 'flex' },
	title: {
		fontSize: fontSizes.xl,
		fontWeight: fontWeights.bold,
		minBlockSize: '44px',
	},
	description: { fontSize: fontSizes.md },
	reviewCardsHeaderContainer: { display: 'flex' },
	reviewCardsHeaderText: { flexBasis: 0, flexGrow: 1, flexShrink: 1 },
	reviewCardsList: { display: 'flex', flexDirection: 'column' },
})

export function TopicPage() {
	const { topicId } = useParams({ from: '/library/$topicId' })
	const [{ data: topic }, { data: reviewCards }] = useSuspenseQueries({
		queries: [
			queryOptions(topicQueries.detail(topicId)),
			queryOptions(reviewCardQueries.listByTopic(topicId)),
		],
	})
	const deleteTopic = useDeleteTopic()
	const updateTopic = useUpdateTopic()
	const createReviewCard = useCreateReviewCard()
	const navigate = useNavigate()

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
			if (!topic || title === topic.title) return

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
			if (!topic || description === topic.description) return

			try {
				await updateTopic.mutateAsync({ topicId, description })
			} catch {
				toast.error('Failed to update topic description')
			}
		},
		[topic, topicId, updateTopic],
	)

	const title = useAutoSave({
		initialValue: topic?.title ?? '',
		key: `${topicId}:title`,
		onSave: saveTitle,
	})
	const description = useAutoSave({
		initialValue: topic?.description ?? '',
		key: `${topicId}:description`,
		onSave: saveDescription,
	})

	if (!topic) return null

	return (
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.content)}>
				<header {...stylex.props(styles.header)}>
					<div {...stylex.props(styles.titleBar)}>
						<Textarea
							placeholder='Title'
							aria-label='Topic title'
							onBlur={title.flush}
							onChange={title.onChange}
							value={title.value}
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
					<Textarea
						placeholder='Add description...'
						aria-label='Topic description'
						onBlur={description.flush}
						onChange={description.onChange}
						value={description.value}
						xstyle={styles.description}
					/>
				</header>

				<div {...stylex.props(styles.reviewCardsHeaderContainer)}>
					<h2 {...stylex.props(styles.reviewCardsHeaderText)}>
						Review Cards
					</h2>
					<Button.Icon
						aria-label='Add review card'
						disabled={createReviewCard.isPending}
						onClick={handleCreateReviewCard}
						shape='round'
					>
						<Plus aria-hidden='true' />
					</Button.Icon>
				</div>

				<div {...stylex.props(styles.reviewCardsList)}>
					{reviewCards.map(reviewCard => (
						<ReviewCard
							key={reviewCard._id}
							reviewCard={reviewCard}
							srs={unscheduledSrsState}
						/>
					))}
				</div>
			</div>
		</div>
	)
}
