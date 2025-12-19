import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { Calendar, Home } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ReviewListSkeleton } from '~/app/components/ReviewListSkeleton'
import { useReviewSessionPageHandlers } from '~/app/hooks/useReviewSessionPageHandlers'
import { useSectionCollapse } from '~/app/hooks/useSectionCollapse'
import { PageLayout } from '~/app/layouts/PageLayout'
import { mergeReviewSections } from '~/app/utils/reviewSections'
import { EmptyStateCreateTopicButton } from '~/components/EmptyStateCreateTopicButton'
import { Button } from '~/components/ui/Button'
import {
	Empty,
	EmptyContent,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import {
	useFutureReviewSessions,
	useSoonReviewSessions
} from '~/features/reviews/api/getReviewSessions'
import { ReviewSection } from '~/features/reviews/components/ReviewSection'
import type { ReviewSession } from '~/features/reviews/types/review.types'
import { useTopics } from '~/features/topics/api/getTopics'
import type { Topic } from '~/features/topics/types/topic.types'

type SoonTopicSectionKey = 'tomorrow' | 'nextSevenDays'

type SoonSectionDefinition = {
	id: SoonTopicSectionKey
	label: string
	headingClassName?: string
	emptyMessage: string
}

const SOON_SECTION_DEFINITIONS: Array<SoonSectionDefinition> = [
	{
		id: 'tomorrow',
		label: 'Tomorrow',
		emptyMessage: 'No topics due tomorrow.'
	},
	{
		id: 'nextSevenDays',
		label: 'Next Few Days',
		emptyMessage: 'No topics due in the next few days.'
	}
]

type FutureSection = {
	id: string
	label: string
	entries: Array<Topic>
}

export function UpcomingPage() {
	const [showFuture, setShowFuture] = useState(false)

	// Always fetch soon data (tomorrow + next 7 days)
	const { sections: soonReviewSections, isLoading: soonReviewsLoading } =
		useSoonReviewSessions()

	const nextWeekDate = dayjs().add(7, 'day').format('YYYY-MM-DD')
	const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
	const { data: soonTopics, isLoading: soonTopicsLoading } = useTopics({
		dueAfter: tomorrow,
		dueBefore: nextWeekDate,
		archived: false,
		srsEnabled: true,
		scheduled: false
	})

	// Centralized date boundary calculations
	const dateBoundaries = useMemo(() => {
		const newDate = new Date()

		const todayDateStr = dayjs(newDate).format('YYYY-MM-DD')

		const tomorrowDate = new Date()
		tomorrowDate.setDate(tomorrowDate.getDate() + 1)
		const tomorrowDateStr = dayjs(tomorrowDate).format('YYYY-MM-DD')

		const nextWeekDate = new Date()
		nextWeekDate.setDate(nextWeekDate.getDate() + 7)
		const nextWeekDateStr = dayjs(nextWeekDate).format('YYYY-MM-DD')

		const dayAfterTomorrowDate = new Date()
		dayAfterTomorrowDate.setDate(dayAfterTomorrowDate.getDate() + 2)
		const dayAfterTomorrowDateStr =
			dayjs(dayAfterTomorrowDate).format('YYYY-MM-DD')

		return {
			todayDateStr,
			tomorrowDateStr,
			nextWeekDateStr,
			dayAfterTomorrowDateStr
		}
	}, [])

	const soonTopicSections = useMemo(() => {
		const topicList = soonTopics ?? []

		const tomorrowList: Array<Topic> = []
		const nextSevenDaysList: Array<Topic> = []

		for (const topic of topicList) {
			if (!topic.due) {
				// Skip unscheduled topics (shouldn't happen with our query but be safe)
				continue
			}

			const dueDate = topic.due

			// Tomorrow
			if (dueDate === dateBoundaries.tomorrowDateStr) {
				tomorrowList.push(topic)
			}
			// Next 7 Days
			else if (
				dueDate >= dateBoundaries.dayAfterTomorrowDateStr &&
				dueDate <= dateBoundaries.nextWeekDateStr
			) {
				nextSevenDaysList.push(topic)
			}
		}

		return SOON_SECTION_DEFINITIONS.map(def => {
			const entries = def.id === 'tomorrow' ? tomorrowList : nextSevenDaysList

			return {
				...def,
				entries
			}
		})
	}, [soonTopics, dateBoundaries])

	// Conditionally fetch future data (8+ days, monthly groups)
	const {
		sections: futureReviewSections = [],
		isLoading: futureReviewsLoading,
		isFetched: futureReviewsFetched
	} = useFutureReviewSessions({ enabled: showFuture })

	const futureStartDate = dayjs().add(8, 'day').format('YYYY-MM-DD')
	const {
		data: futureTopics,
		isLoading: futureTopicsLoading,
		isFetched: futureTopicsFetched
	} = useTopics(
		{
			dueAfter: futureStartDate,
			archived: false,
			srsEnabled: true,
			scheduled: false
		},
		{ enabled: showFuture }
	)

	// Group topics by month
	const futureTopicSections = useMemo(() => {
		if (!futureTopics) {
			return []
		}

		const monthlyGroups = new Map<string, Array<Topic>>()

		for (const topic of futureTopics) {
			const dueDate = topic.due

			// Skip topics without due date
			if (!dueDate) {
				continue
			}

			const monthKey = dayjs(dueDate).format('YYYY-MM')

			if (!monthlyGroups.has(monthKey)) {
				monthlyGroups.set(monthKey, [])
			}
			const group = monthlyGroups.get(monthKey)
			if (group) {
				group.push(topic)
			}
		}

		// Convert to array of sections, sorted by month ascending (earliest first)
		const sectionsArray: Array<FutureSection> = Array.from(
			monthlyGroups.entries()
		).map(([monthKey, entries]) => ({
			id: monthKey,
			label: dayjs(`${monthKey}-01`).format('MMMM YYYY'),
			entries
		}))

		// Sort by month key ascending (earliest month first)
		sectionsArray.sort((a, b) => a.id.localeCompare(b.id))

		return sectionsArray
	}, [futureTopics])

	useEffect(() => {
		if (futureReviewsFetched && futureTopicsFetched) {
			setShowFuture(true)
		}
	}, [futureReviewsFetched, futureTopicsFetched])

	useEffect(() => {
		const totalEntries =
			soonReviewSections.reduce(
				(sum, section) => sum + section.entries.length,
				0
			) +
			soonTopicSections.reduce(
				(sum, section) => sum + section.entries.length,
				0
			)
		if (totalEntries < 20) {
			setShowFuture(true)
		}
	}, [soonReviewSections, soonTopicSections])

	const {
		handleReviewClick,
		handleTopicClick,
		handleCreateTopic,
		isCreatingTopic
	} = useReviewSessionPageHandlers()
	const { collapsedSections, toggleSection } = useSectionCollapse()

	// Merge soon sections (tomorrow + next 7 days)
	const soonMergedSections = useMemo(() => {
		return mergeReviewSections(soonReviewSections, soonTopicSections, {
			sectionOrder: ['tomorrow', 'nextSevenDays']
		})
	}, [soonReviewSections, soonTopicSections])

	// Merge future sections (monthly groups)
	const futureMergedSections = useMemo(() => {
		const merged = mergeReviewSections(
			futureReviewSections,
			futureTopicSections
		)
		// Sort by month key ascending (earliest first)
		return merged.sort((a, b) => a.id.localeCompare(b.id))
	}, [futureReviewSections, futureTopicSections])

	// Combine all sections and filter out ones that shouldn't be shown
	const allSections = useMemo(() => {
		const combined = [...soonMergedSections, ...futureMergedSections]
		return combined.filter(section => {
			const reviewEntries = section.reviewsData?.entries ?? []
			const topicEntries = section.topicsData?.entries ?? []
			const totalCount = reviewEntries.length + topicEntries.length
			return (
				totalCount > 0 ||
				section.id === 'tomorrow' ||
				section.id === 'nextSevenDays'
			)
		})
	}, [soonMergedSections, futureMergedSections])

	const isInitialLoading = soonReviewsLoading || soonTopicsLoading
	const isMonthlyLoading = futureReviewsLoading || futureTopicsLoading

	// Check if all sections are empty
	const allSectionsEmpty = allSections.every(section => {
		const reviewEntries = section.reviewsData?.entries ?? []
		const topicEntries = section.topicsData?.entries ?? []
		return reviewEntries.length === 0 && topicEntries.length === 0
	})

	return (
		<PageLayout>
			<PageLayout.Header icon={Calendar} title='Upcoming' />
			<UpcomingList
				allSections={allSections}
				allSectionsEmpty={allSectionsEmpty}
				collapsedSections={collapsedSections}
				isCreatingTopic={isCreatingTopic}
				isInitialLoading={isInitialLoading}
				isMonthlyLoading={isMonthlyLoading}
				onCreateTopic={handleCreateTopic}
				onReviewClick={handleReviewClick}
				onShowMore={() => setShowFuture(true)}
				onToggleCollapse={toggleSection}
				onTopicClick={handleTopicClick}
				showFuture={showFuture}
			/>
		</PageLayout>
	)
}

function UpcomingList({
	allSections,
	allSectionsEmpty,
	collapsedSections,
	isCreatingTopic,
	isInitialLoading,
	isMonthlyLoading,
	onCreateTopic,
	onReviewClick,
	onShowMore,
	onToggleCollapse,
	onTopicClick,
	showFuture
}: {
	allSections: Array<{
		id: string
		label: string
		reviewsData?: { entries: Array<ReviewSession> }
		topicsData?: { entries: Array<Topic> }
	}>
	allSectionsEmpty: boolean
	collapsedSections: Record<string, boolean>
	isCreatingTopic: boolean
	isInitialLoading: boolean
	isMonthlyLoading: boolean
	onCreateTopic: () => void
	onReviewClick: (reviewId: number) => void
	onShowMore: () => void
	onToggleCollapse: (sectionId: string) => void
	onTopicClick: (topic: Topic) => void
	showFuture: boolean
}) {
	const navigate = useNavigate()

	if (isInitialLoading) {
		return <ReviewListSkeleton />
	}

	if (allSectionsEmpty) {
		return (
			<PageLayout.Content>
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant='icon'>
							<Calendar />
						</EmptyMedia>
						<EmptyTitle>
							Scheduled reviews and topics will appear here.
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
			</PageLayout.Content>
		)
	}

	return (
		<PageLayout.Content>
			{allSections.map(section => (
				<ReviewSection
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

			{/* Show More button */}
			{!showFuture && (
				<div className='mt-8 text-center'>
					<Button
						disabled={isMonthlyLoading}
						onClick={onShowMore}
						variant='outline'
					>
						{isMonthlyLoading ? 'Loading...' : 'Show More'}
					</Button>
				</div>
			)}
		</PageLayout.Content>
	)
}
