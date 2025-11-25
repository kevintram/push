import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useUnscheduledReviews } from '~/features/reviews/api/useUnscheduledReviews'
import { ReviewPageHeader } from '~/features/reviews/components/ReviewPageHeader'
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
			<div className='flex h-full flex-col overflow-auto bg-primary-foreground'>
				<ReviewPageHeader activeBadge='unscheduled' />
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
