import type { Id } from '@convex/_generated/dataModel'
import { toast } from 'sonner'

import { MoveTopicDialogBase } from '~/modules/library/components/move-topic'

import { useUpdateReviewCard } from '../api/reviewCardQueries'
import type { ReviewCard } from '../types/review.types'

type MoveReviewCardDialogProps = {
	onOpenChange: (open: boolean) => void
	reviewCard: ReviewCard
}

export function MoveReviewCardDialog({
	onOpenChange,
	reviewCard,
}: MoveReviewCardDialogProps) {
	const updateReviewCard = useUpdateReviewCard()

	const handleMove = (destination: Id<'topics'>) => {
		updateReviewCard.mutate(
			{
				reviewCardId: reviewCard._id,
				topicId: destination,
			},
			{
				onError: () => toast.error('Failed to move review card'),
				onSuccess: () => onOpenChange(false),
			},
		)
	}

	return (
		<MoveTopicDialogBase
			initialDestination={reviewCard.topicId}
			isPending={updateReviewCard.isPending}
			onMove={handleMove}
			onOpenChange={onOpenChange}
			title='Move review card'
		/>
	)
}
