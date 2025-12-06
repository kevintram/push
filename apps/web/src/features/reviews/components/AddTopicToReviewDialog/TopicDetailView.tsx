import { Minus, X } from 'lucide-react'
import { Button } from '~/components/ui/Button'
import { TopicDetail } from '~/features/topics/components/TopicDetail/TopicDetail'
import { TopicContext } from '~/features/topics/stores/SelectedTopicContext'
import type { Rating, Topic, TopicReview } from '~/models/review-topic.types'
import { TopicReviewStatusButton } from './ReviewStatusButton'

interface DialogState {
	topicContextValue: {
		topic: Topic | undefined
		isLoading: boolean
	}
	minimizeTopicDetail: () => void
	closeTopicDetail: () => void
	selectedTopic: Topic | undefined
	selectedTopicIsAdded: boolean
	isReviewCompleted: boolean
	selectedTopicReview: TopicReview | undefined
	addTopicToReview: (topic: Topic) => Promise<void>
	updateRating: (topicReviewId: number, rating: Rating) => Promise<void>
	removeTopicFromReview: (topic: Topic) => Promise<void>
	switchToTopic: (topic: Topic) => void
	handleTopicDeleted: () => void
}

interface TopicDetailViewProps {
	dialog: DialogState
	onNestedTopicCreated: (topic: Topic) => Promise<void>
	renderAddTopicCard: (
		topic: Topic,
		removeRelationship?: () => void
	) => React.ReactNode
}

export function TopicDetailView({
	dialog,
	onNestedTopicCreated,
	renderAddTopicCard
}: TopicDetailViewProps) {
	return (
		<TopicContext value={dialog.topicContextValue}>
			<TopicDetail
				afterMoreButton={
					<>
						<Button
							className='h-6 w-6 p-0 text-muted-foreground'
							onClick={dialog.minimizeTopicDetail}
							size='sm'
							title='Minimize'
							variant='ghost'
						>
							<Minus className='h-4 w-4' />
						</Button>
						<Button
							className='h-6 w-6 p-0 text-muted-foreground'
							onClick={dialog.closeTopicDetail}
							size='sm'
							title='Back to search'
							variant='ghost'
						>
							<X className='h-4 w-4' />
						</Button>
					</>
				}
				beforeMoreButton={
					dialog.selectedTopic ? (
						<TopicReviewStatusButton
							isAdded={dialog.selectedTopicIsAdded}
							isReviewCompleted={dialog.isReviewCompleted}
							onAdd={() => {
								if (dialog.selectedTopic) {
									dialog.addTopicToReview(dialog.selectedTopic).catch(() => {})
								}
							}}
							onRatingChange={
								dialog.selectedTopicReview
									? rating => {
											if (dialog.selectedTopicReview) {
												dialog
													.updateRating(dialog.selectedTopicReview.id, rating)
													.catch(() => {})
											}
										}
									: undefined
							}
							onRemove={() => {
								if (dialog.selectedTopic) {
									dialog
										.removeTopicFromReview(dialog.selectedTopic)
										.catch(() => {})
								}
							}}
							rating={dialog.selectedTopicReview?.rating}
						/>
					) : null
				}
				onChildClicked={dialog.switchToTopic}
				onDelete={dialog.handleTopicDeleted}
				onParentClicked={dialog.switchToTopic}
				onTopicCreated={onNestedTopicCreated}
				renderChildCard={renderAddTopicCard}
				reviewSidebarReadonly={true}
			/>
		</TopicContext>
	)
}
