import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { ArrowUpRight, Home, Star } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { PageHeader } from '~/app/layouts/PageLayout'
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
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useCreateTopicWithReview } from '~/features/reviews/api/createTopicReview'
import { useTodayReviews } from '~/features/reviews/api/getReviews'
import { ReviewPageSkeleton } from '~/features/reviews/components/ReviewPageSkeleton'
import { ReviewSection } from '~/features/reviews/components/ReviewSection'
import { useTopics } from '~/features/topics/api/getTopics'
import type { Topic } from '~/models/review-topic.types'

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
	const navigate = useNavigate()
	const { sections: reviewSections, isLoading: reviewsLoading } =
		useTodayReviews()

	const today = dayjs().format('YYYY-MM-DD')
	const { data: topics, isLoading: topicsLoading } = useTopics({
		dueBefore: today,
		archived: false,
		srsEnabled: true
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

	const { openReviewDialog, openTopicDialog } = useReviewTopicDialog()
	const { createTopicWithReview, isTopicCreatePending: isCreatingTopic } =
		useCreateTopicWithReview()

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

	const handleCreateTopic = useCallback(async () => {
		const createdTopic = await createTopicWithReview({})
		openTopicDialog(createdTopic.id)
	}, [createTopicWithReview, openTopicDialog])

	// Merge sections by matching IDs
	const mergedSections = useMemo(() => {
		const sectionMap = new Map<
			string,
			{
				id: string
				label: string
				headingClassName?: string
				reviewsData?: (typeof reviewSections)[0]
				topicsData?: (typeof topicSections)[0]
			}
		>()

		// Add review sections
		for (const section of reviewSections) {
			sectionMap.set(section.id, {
				id: section.id,
				label: section.label,
				headingClassName: section.headingClassName,
				reviewsData: section
			})
		}

		// Add or merge topic sections
		for (const section of topicSections) {
			const existing = sectionMap.get(section.id)
			if (existing) {
				existing.topicsData = section
			} else {
				sectionMap.set(section.id, {
					id: section.id,
					label: section.label,
					headingClassName: section.headingClassName,
					topicsData: section
				})
			}
		}

		// Convert to array and sort by predefined order
		const sectionOrder = ['overdue', 'today']

		const sorted = Array.from(sectionMap.values()).sort((a, b) => {
			const aIndex = sectionOrder.indexOf(a.id)
			const bIndex = sectionOrder.indexOf(b.id)
			return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
		})

		// Filter out sections that shouldn't be shown
		return sorted.filter(section => {
			const reviewEntries = section.reviewsData?.entries ?? []
			const topicEntries = section.topicsData?.entries ?? []
			const totalCount = reviewEntries.length + topicEntries.length
			return totalCount > 0 || section.id === 'today'
		})
	}, [reviewSections, topicSections])

	if (reviewsLoading || topicsLoading) {
		return <ReviewPageSkeleton />
	}

	// Check if all sections are empty
	const allSectionsEmpty = mergedSections.every(section => {
		const reviewEntries = section.reviewsData?.entries ?? []
		const topicEntries = section.topicsData?.entries ?? []
		return reviewEntries.length === 0 && topicEntries.length === 0
	})

	return (
		<div className='scrollbar-track-transparent relative flex h-full w-full flex-col'>
			<div className='flex h-full flex-col overflow-auto'>
				<PageHeader icon={Star} title='Today' />
				<div className='p-4'>
					{allSectionsEmpty ? (
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
											onClick={handleCreateTopic}
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
					) : (
						mergedSections.map(section => (
							<ReviewSection
								headingClassName={section.headingClassName}
								id={section.id}
								isCollapsed={collapsedSections[section.id] ?? false}
								key={section.id}
								label={section.label}
								onReviewClick={handleReviewClick}
								onToggleCollapse={toggleSection}
								onTopicClick={handleTopicClick}
								reviewEntries={section.reviewsData?.entries ?? []}
								topicEntries={section.topicsData?.entries ?? []}
							/>
						))
					)}
				</div>
			</div>
		</div>
	)
}
