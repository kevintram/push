import { createFileRoute } from '@tanstack/react-router'
import { CircleDashed } from 'lucide-react'
import { useCallback, useState } from 'react'
import { PageHeader } from '~/components/PageHeader'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { ReviewPageSkeleton } from '~/features/reviews/components/ReviewPageSkeleton'
import { ReviewSection } from '~/features/reviews/components/ReviewSection'
import { useUnscheduledReviews } from '~/features/reviews/hooks/useUnscheduledReviews'
import { useUnscheduledTopics } from '~/features/topics/hooks/useUnscheduledTopics'
import type { Topic } from '~/models/review-topic.types'

export const Route = createFileRoute('/unscheduled')({
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
				<PageHeader icon={CircleDashed} title='Unscheduled' />
				<div className='p-4'>
					{reviewSection.entries.length > 0 ||
					topicSection.entries.length > 0 ? (
						<div className='mb-2'>
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
					) : null}
				</div>
			</div>
		</div>
	)
}
