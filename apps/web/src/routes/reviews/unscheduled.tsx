import { createFileRoute } from '@tanstack/react-router'
import { Badge } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useUnscheduledReviews } from '~/features/reviews/api/useUnscheduledReviews'
import { ReviewPageSkeleton } from '~/features/reviews/components/ReviewPageSkeleton'
import { ReviewSection } from '~/features/reviews/components/ReviewSection'
import { useUnscheduledTopics } from '~/features/topics/api/useUnscheduledTopics'
import type { Topic } from '~/models/review-topic.types'

export const Route = createFileRoute('/reviews/unscheduled')({
	component: UnscheduledPage
})

function UnscheduledPage() {
	const { section: reviewSection, isLoading: reviewsLoading } =
		useUnscheduledReviews()

	const { section: topicSection, isLoading: topicsLoading } =
		useUnscheduledTopics()

	const { openReviewDialog, openTopicDialog } = useReviewTopicDialog()

	const [collapsedSections, setCollapsedSections] = useState<
		Record<string, boolean>
	>({})

	const toggleSection = useCallback((sectionId: string) => {
		setCollapsedSections(prev => ({
			...prev,
			[sectionId]: !prev[sectionId]
		}))
	}, [])

	const handleReviewClick = useCallback(
		(reviewId: number) => {
			openReviewDialog(reviewId)
		},
		[openReviewDialog]
	)

	const handleTopicClick = useCallback(
		(topic: Topic) => {
			openTopicDialog(topic.id)
		},
		[openTopicDialog]
	)

	if (reviewsLoading || topicsLoading) {
		return <ReviewPageSkeleton />
	}

	const isSectionCollapsed = collapsedSections.unscheduled ?? false

	return (
		<div className='scrollbar-track-transparent relative flex h-full w-full flex-col'>
			<div className='flex h-full flex-col overflow-auto'>
				<div className='sticky top-0 z-10 flex flex-col gap-2 rounded-tl-sm border-tl-2 border-b-1 bg-primary-foreground/40 px-4 pt-4 pb-2 backdrop-blur-sm'>
					<div className='flex items-center justify-between'>
						<h1 className='flex items-center gap-2 font-bold text-xl'>
							<Badge className='h-5 w-5' />
							Unscheduled
						</h1>
					</div>
				</div>
				<div className='px-6'>
					<ReviewSection
						headingClassName={reviewSection.headingClassName}
						id='unscheduled'
						isCollapsed={isSectionCollapsed}
						label={reviewSection.label}
						onReviewClick={handleReviewClick}
						onToggleCollapse={toggleSection}
						onTopicClick={handleTopicClick}
						reviewEntries={reviewSection.entries}
						topicEntries={topicSection.entries}
					/>
				</div>
			</div>
		</div>
	)
}
