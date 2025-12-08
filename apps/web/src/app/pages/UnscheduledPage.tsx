import { useNavigate } from '@tanstack/react-router'
import { CircleDashed, Home } from 'lucide-react'
import { useMemo } from 'react'
import { useReviewPageHandlers } from '~/app/hooks/useReviewPageHandlers'
import { useSectionCollapse } from '~/app/hooks/useSectionCollapse'
import { PageLayout } from '~/app/layouts/PageLayout'
import { EmptyStateCreateTopicButton } from '~/components/EmptyStateCreateTopicButton'
import { Button } from '~/components/ui/Button'
import {
	Empty,
	EmptyContent,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import { useUnscheduledReviews } from '~/features/reviews/api/getReviews'
import { ReviewPageSkeleton } from '~/features/reviews/components/ReviewPageSkeleton'
import { ReviewSection } from '~/features/reviews/components/ReviewSection'
import { useTopics } from '~/features/topics/api/getTopics'
import type { Review, Topic } from '~/models/review-topic.types'

type UnscheduledSectionDefinition = {
	id: 'unscheduled'
	label: string
	headingClassName?: string
	emptyMessage: string
}

const UNSCHEDULED_SECTION_DEFINITION: UnscheduledSectionDefinition = {
	id: 'unscheduled',
	label: 'Unscheduled',
	headingClassName: 'text-gray-600',
	emptyMessage: 'All topics have due dates.'
}

export function UnscheduledPage() {
	const { section: reviewSection, isLoading: reviewsLoading } =
		useUnscheduledReviews()

	const { data: allTopics, isLoading: topicsLoading } = useTopics({
		archived: false,
		srsEnabled: true
	})

	const topicSection = useMemo(() => {
		const unscheduledTopics = (allTopics ?? []).filter(
			topic => topic.due === null
		)
		return {
			...UNSCHEDULED_SECTION_DEFINITION,
			entries: unscheduledTopics
		}
	}, [allTopics])

	const {
		handleReviewClick,
		handleTopicClick,
		handleCreateTopic,
		isCreatingTopic
	} = useReviewPageHandlers()
	const { collapsedSections, toggleSection } = useSectionCollapse()

	if (reviewsLoading || topicsLoading) {
		return <ReviewPageSkeleton />
	}

	const isSectionCollapsed = collapsedSections.unscheduled ?? false
	const hasEntries =
		reviewSection.entries.length > 0 || topicSection.entries.length > 0

	return (
		<PageLayout>
			<PageLayout.Header icon={CircleDashed} title='Unscheduled' />
			<UnscheduledList
				hasEntries={hasEntries}
				isCreatingTopic={isCreatingTopic}
				isSectionCollapsed={isSectionCollapsed}
				onCreateTopic={handleCreateTopic}
				onReviewClick={handleReviewClick}
				onToggleCollapse={toggleSection}
				onTopicClick={handleTopicClick}
				reviewSection={reviewSection}
				topicSection={topicSection}
			/>
		</PageLayout>
	)
}

function UnscheduledList({
	hasEntries,
	isCreatingTopic,
	isSectionCollapsed,
	onCreateTopic,
	onReviewClick,
	onToggleCollapse,
	onTopicClick,
	reviewSection,
	topicSection
}: {
	hasEntries: boolean
	isCreatingTopic: boolean
	isSectionCollapsed: boolean
	onCreateTopic: () => void
	onReviewClick: (reviewId: number) => void
	onToggleCollapse: (sectionId: string) => void
	onTopicClick: (topic: Topic) => void
	reviewSection: {
		headingClassName?: string
		label: string
		entries: Array<Review>
	}
	topicSection: {
		entries: Array<Topic>
	}
}) {
	const navigate = useNavigate()

	if (!hasEntries) {
		return (
			<div className='p-4'>
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant='icon'>
							<CircleDashed />
						</EmptyMedia>
						<EmptyTitle>
							Unscheduled topics and reviews will appear here.
						</EmptyTitle>
					</EmptyHeader>
					<EmptyContent>
						<div className='flex gap-2'>
							<EmptyStateCreateTopicButton
								disabled={isCreatingTopic}
								onClick={onCreateTopic}
							/>
							<Button
								onClick={() => navigate({ to: '/home' })}
								variant='outline'
							>
								<Home />
								Topics
							</Button>
						</div>
					</EmptyContent>
				</Empty>
			</div>
		)
	}

	return (
		<div className='p-4'>
			<div className='mb-2'>
				<ReviewSection
					headingClassName={reviewSection.headingClassName}
					id='unscheduled'
					isCollapsed={isSectionCollapsed}
					label={reviewSection.label}
					onReviewClick={onReviewClick}
					onToggleCollapse={onToggleCollapse}
					onTopicClick={onTopicClick}
					reviewEntries={reviewSection.entries}
					topicEntries={topicSection.entries}
				/>
			</div>
		</div>
	)
}
