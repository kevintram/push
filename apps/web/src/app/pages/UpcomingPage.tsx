import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { Calendar, Home } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeader } from '~/app/layouts/PageLayout'
import { EmptyStateCreateTopicButton } from '~/components/EmptyStateCreateTopicButton'
import { Button } from '~/components/ui/Button'
import {
	Empty,
	EmptyContent,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useCreateTopicWithReview } from '~/features/reviews/api/createTopicReview'
import {
	useFutureReviews,
	useSoonReviews
} from '~/features/reviews/api/getReviews'
import { ReviewPageSkeleton } from '~/features/reviews/components/ReviewPageSkeleton'
import { ReviewSection } from '~/features/reviews/components/ReviewSection'
import { useTopics } from '~/features/topics/api/getTopics'
import type { Topic } from '~/models/review-topic.types'

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
	const navigate = useNavigate()
	const [showFuture, setShowFuture] = useState(false)

	// Always fetch soon data (tomorrow + next 7 days)
	const { sections: soonReviewSections, isLoading: soonReviewsLoading } =
		useSoonReviews()

	const nextWeekDate = dayjs().add(7, 'day').format('YYYY-MM-DD')
	const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
	const { data: soonTopics, isLoading: soonTopicsLoading } = useTopics({
		dueAfter: tomorrow,
		dueBefore: nextWeekDate,
		archived: false,
		srsEnabled: true
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
	} = useFutureReviews({ enabled: showFuture })

	const futureStartDate = dayjs().add(8, 'day').format('YYYY-MM-DD')
	const {
		data: futureTopics,
		isLoading: futureTopicsLoading,
		isFetched: futureTopicsFetched
	} = useTopics(
		{
			dueAfter: futureStartDate,
			archived: false,
			srsEnabled: true
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

	// Merge soon sections (tomorrow + next 7 days)
	const soonMergedSections = useMemo(() => {
		const sectionMap = new Map<
			string,
			{
				id: string
				label: string
				headingClassName?: string
				reviewsData?: (typeof soonReviewSections)[0]
				topicsData?: (typeof soonTopicSections)[0]
			}
		>()

		// Add review sections
		for (const section of soonReviewSections) {
			sectionMap.set(section.id, {
				id: section.id,
				label: section.label,
				headingClassName: section.headingClassName,
				reviewsData: section
			})
		}

		// Add or merge topic sections
		for (const section of soonTopicSections) {
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
		const sectionOrder = ['tomorrow', 'nextSevenDays']

		return Array.from(sectionMap.values()).sort((a, b) => {
			const aIndex = sectionOrder.indexOf(a.id)
			const bIndex = sectionOrder.indexOf(b.id)
			return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
		})
	}, [soonReviewSections, soonTopicSections])

	// Merge future sections (monthly groups)
	const futureMergedSections = useMemo(() => {
		const sectionMap = new Map<
			string,
			{
				id: string
				label: string
				reviewsData?: (typeof futureReviewSections)[0]
				topicsData?: (typeof futureTopicSections)[0]
			}
		>()

		// Add review sections
		for (const section of futureReviewSections) {
			sectionMap.set(section.id, {
				id: section.id,
				label: section.label,
				reviewsData: section
			})
		}

		// Add or merge topic sections
		for (const section of futureTopicSections) {
			const existing = sectionMap.get(section.id)
			if (existing) {
				existing.topicsData = section
			} else {
				sectionMap.set(section.id, {
					id: section.id,
					label: section.label,
					topicsData: section
				})
			}
		}

		// Convert to array and sort by month key ascending (earliest first)
		return Array.from(sectionMap.values()).sort((a, b) =>
			a.id.localeCompare(b.id)
		)
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

	if (isInitialLoading) {
		return <ReviewPageSkeleton />
	}

	// Check if all sections are empty
	const allSectionsEmpty = allSections.every(section => {
		const reviewEntries = section.reviewsData?.entries ?? []
		const topicEntries = section.topicsData?.entries ?? []
		return reviewEntries.length === 0 && topicEntries.length === 0
	})

	return (
		<div className='scrollbar-track-transparent relative flex h-full w-full flex-col'>
			<div className='flex h-full flex-col overflow-auto'>
				<PageHeader icon={Calendar} title='Upcoming' />
				<div className='p-4'>
					{allSectionsEmpty ? (
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
						</Empty>
					) : (
						<>
							{allSections.map(section => (
								<ReviewSection
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
							))}

							{/* Show More button */}
							{!showFuture && (
								<div className='mt-8 text-center'>
									<Button
										disabled={isMonthlyLoading}
										onClick={() => setShowFuture(true)}
										variant='outline'
									>
										{isMonthlyLoading ? 'Loading...' : 'Show More'}
									</Button>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	)
}
