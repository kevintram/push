import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useCallback } from 'react'
import { Button } from '~/components/ui/Button'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { createReview } from '~/features/reviews/api'
import { type BadgeType, ReviewBadgeNav } from './ReviewBadgeNav'

type ReviewPageHeaderProps = {
	activeBadge: BadgeType
}

export function ReviewPageHeader({ activeBadge }: ReviewPageHeaderProps) {
	const queryClient = useQueryClient()
	const { openReviewDialog } = useReviewTopicDialog()

	const { mutateAsync: createReviewMutation } = useMutation({
		mutationFn: createReview,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['reviews'] })
		}
	})

	const handleNewReview = useCallback(async () => {
		const review = await createReviewMutation({
			description: '',
			scheduledAt: null,
			completedAt: null
		})
		openReviewDialog(review.id)
	}, [createReviewMutation, openReviewDialog])

	return (
		<div className='sticky top-0 z-10 flex flex-col gap-2 rounded-tl-sm border-tl-2 border-b-1 bg-primary-foreground/40 px-4 pt-4 pb-2 backdrop-blur-sm'>
			<div className='flex items-center justify-between'>
				<h1 className='font-bold text-xl'>Review</h1>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild={true}>
							<Button onClick={handleNewReview} size='icon' variant='ghost'>
								<Plus />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Create new review</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
			<ReviewBadgeNav activeBadge={activeBadge} />
		</div>
	)
}
