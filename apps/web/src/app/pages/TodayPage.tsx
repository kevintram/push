import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { ArrowUpRight, Home, Star } from 'lucide-react'
import { useMemo } from 'react'
import { ReviewListSkeleton } from '~/app/components/ReviewListSkeleton'
import { useReviewPageHandlers } from '~/app/hooks/useReviewPageHandlers'
import { useSectionCollapse } from '~/app/hooks/useSectionCollapse'
import { PageLayout } from '~/app/layouts/PageLayout'
import { mergeReviewSections } from '~/app/utils/reviewSections'
import { EmptyStateCreateTopicButton } from '~/components/EmptyStateCreateTopicButton'
import { Button } from '~/components/ui/Button'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import { useTodayReviews } from '~/features/reviews/api/getReviews'
import { ReviewSection } from '~/features/reviews/components/ReviewSection'
import type { Review } from '~/features/reviews/types/review.types'
import { useTopics } from '~/features/topics/api/getTopics'
import type { Topic } from '~/features/topics/types/topic.types'

type TodayTopicSectionKey = 'overdue' | 'today'

type SectionDefinition = {
	id: TodayTopicSectionKey
	label: string
	headingClassName?: string
	emptyMessage: string
}

const SECTION_DEFINITIONS: Array<SectionDefinition> = [
	{
		id: 'overdue',
		label: 'Overdue',
		headingClassName: 'text-red-600',
		emptyMessage: "You're all caught up—no overdue topics."
	},
	{
		id: 'today',
		label: 'Today',
		emptyMessage: 'No topics due today.'
	}
]

export function TodayPage() {
	const { sections: reviewSections, isLoading: reviewsLoading } =
		useTodayReviews()

	const today = dayjs().format('YYYY-MM-DD')
	const { data: topics, isLoading: topicsLoading } = useTopics({
		dueBefore: today,
		archived: false,
		srsEnabled: true,
		scheduled: false
	})

	const todayDateStr = useMemo(() => {
		return dayjs().format('YYYY-MM-DD')
	}, [])

	const topicSections = useMemo(() => {
		const topicList = topics ?? []

		const overdueList: Array<Topic> = []
		const todayList: Array<Topic> = []

		for (const topic of topicList) {
			if (!topic.due) {
				// Skip unscheduled topics (shouldn't happen with our query but be safe)
				continue
			}

			const dueDate = topic.due

			// Today
			if (dueDate === todayDateStr) {
				todayList.push(topic)
			}
			// Overdue
			else if (dueDate < todayDateStr) {
				overdueList.push(topic)
			}
		}

		return SECTION_DEFINITIONS.map(def => {
			const entries = def.id === 'overdue' ? overdueList : todayList

			return {
				...def,
				entries
			}
		})
	}, [topics, todayDateStr])

	const {
		handleReviewClick,
		handleTopicClick,
		handleCreateTopic,
		isCreatingTopic
	} = useReviewPageHandlers()
	const { collapsedSections, toggleSection } = useSectionCollapse()

	// Merge sections by matching IDs
	const mergedSections = useMemo(() => {
		return mergeReviewSections(reviewSections, topicSections, {
			sectionOrder: ['overdue', 'today'],
			filterEmpty: section => {
				const reviewEntries = section.reviewsData?.entries ?? []
				const topicEntries = section.topicsData?.entries ?? []
				const totalCount = reviewEntries.length + topicEntries.length
				return totalCount > 0 || section.id === 'today'
			}
		})
	}, [reviewSections, topicSections])

	// Check if all sections are empty
	const allSectionsEmpty = mergedSections.every(section => {
		const reviewEntries = section.reviewsData?.entries ?? []
		const topicEntries = section.topicsData?.entries ?? []
		return reviewEntries.length === 0 && topicEntries.length === 0
	})

	return (
		<PageLayout>
			<PageLayout.Header icon={Star} title='Today' />
			<TodayList
				allSectionsEmpty={allSectionsEmpty}
				collapsedSections={collapsedSections}
				isCreatingTopic={isCreatingTopic}
				isLoading={reviewsLoading || topicsLoading}
				mergedSections={mergedSections}
				onCreateTopic={handleCreateTopic}
				onReviewClick={handleReviewClick}
				onToggleCollapse={toggleSection}
				onTopicClick={handleTopicClick}
			/>
		</PageLayout>
	)
}

function TodayList({
	allSectionsEmpty,
	collapsedSections,
	isCreatingTopic,
	isLoading,
	mergedSections,
	onCreateTopic,
	onReviewClick,
	onToggleCollapse,
	onTopicClick
}: {
	allSectionsEmpty: boolean
	collapsedSections: Record<string, boolean>
	isCreatingTopic: boolean
	isLoading: boolean
	mergedSections: Array<{
		id: string
		label: string
		headingClassName?: string
		reviewsData?: { entries: Array<Review> }
		topicsData?: { entries: Array<Topic> }
	}>
	onCreateTopic: () => void
	onReviewClick: (reviewId: number) => void
	onToggleCollapse: (sectionId: string) => void
	onTopicClick: (topic: Topic) => void
}) {
	const navigate = useNavigate()

	if (isLoading) {
		return <ReviewListSkeleton />
	}

	if (allSectionsEmpty) {
		return (
			<div className='p-4'>
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant='icon'>
							<Star />
						</EmptyMedia>
						<EmptyTitle>Nothing due today.</EmptyTitle>
						<EmptyDescription>
							Reviews and topics due today will appear here.
						</EmptyDescription>
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
						<div className='flex gap-2'>
							<Button
								onClick={() => navigate({ to: '/upcoming' })}
								variant='link'
							>
								Check upcoming
								<ArrowUpRight />
							</Button>
						</div>
					</EmptyHeader>
				</Empty>
			</div>
		)
	}

	return (
		<div className='p-4'>
			{mergedSections.map(section => (
				<ReviewSection
					headingClassName={section.headingClassName}
					id={section.id}
					isCollapsed={collapsedSections[section.id] ?? false}
					key={section.id}
					label={section.label}
					onReviewClick={onReviewClick}
					onToggleCollapse={onToggleCollapse}
					onTopicClick={onTopicClick}
					reviewEntries={section.reviewsData?.entries ?? []}
					topicEntries={section.topicsData?.entries ?? []}
				/>
			))}
		</div>
	)
}
