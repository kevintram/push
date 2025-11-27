import { createFileRoute } from '@tanstack/react-router'
import { Calendar } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useFutureReviews } from '~/features/reviews/api/useFutureReviews'
import { useSoonReviews } from '~/features/reviews/api/useSoonReviews'
import { ReviewPageSkeleton } from '~/features/reviews/components/ReviewPageSkeleton'
import { ReviewSection } from '~/features/reviews/components/ReviewSection'
import { useFutureTopics } from '~/features/topics/api/useFutureTopics'
import { useSoonTopics } from '~/features/topics/api/useSoonTopics'
import type { Topic } from '~/models/review-topic.types'

export const Route = createFileRoute('/upcoming')({
	component: UpcomingPage
})

function UpcomingPage() {
	const [showFuture, setShowFuture] = useState(false)

	// Always fetch soon data (tomorrow + next 7 days)
	const { sections: soonReviewSections, isLoading: soonReviewsLoading } =
		useSoonReviews()
	const { sections: soonTopicSections, isLoading: soonTopicsLoading } =
		useSoonTopics()

	// Conditionally fetch future data (8+ days, monthly groups)
	const {
		sections: futureReviewSections = [],
		isLoading: futureReviewsLoading,
		isFetched: futureReviewsFetched
	} = useFutureReviews({ enabled: showFuture })
	const {
		sections: futureTopicSections = [],
		isLoading: futureTopicsLoading,
		isFetched: futureTopicsFetched
	} = useFutureTopics({ enabled: showFuture })

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

	// Combine all sections
	const allSections = useMemo(() => {
		return [...soonMergedSections, ...futureMergedSections]
	}, [soonMergedSections, futureMergedSections])

	const isInitialLoading = soonReviewsLoading || soonTopicsLoading
	const isMonthlyLoading = futureReviewsLoading || futureTopicsLoading

	if (isInitialLoading) {
		return <ReviewPageSkeleton />
	}

	return (
		<div className='scrollbar-track-transparent relative flex h-full w-full flex-col'>
			<div className='flex h-full flex-col overflow-auto'>
				<div className='sticky top-0 z-10 flex flex-col gap-2 rounded-tl-sm border-tl-2 border-b-1 bg-primary-foreground/40 px-4 pt-4 pb-2 backdrop-blur-sm'>
					<div className='flex items-center justify-between'>
						<h1 className='flex items-center gap-2 font-bold text-xl'>
							<Calendar className='h-5 w-5' />
							Upcoming
						</h1>
					</div>
				</div>
				<div className='px-6'>
					{allSections.length === 0 ? (
						<p className='mt-8 text-center text-muted-foreground text-sm italic'>
							No upcoming reviews or topics yet.
						</p>
					) : (
						<>
							{allSections.map((section, index) => {
								const prev = index > 0 ? allSections[index - 1] : undefined
								const reviewEntries = section.reviewsData?.entries ?? []
								const topicEntries = section.topicsData?.entries ?? []

								const isSectionCollapsed =
									collapsedSections[section.id] ?? false
								const prevCollapsed = prev
									? (collapsedSections[prev.id] ?? false)
									: false

								return (
									<ReviewSection
										alwaysShow={
											section.id === 'tomorrow' ||
											section.id === 'nextSevenDays'
										}
										id={section.id}
										isCollapsed={isSectionCollapsed}
										key={section.id}
										label={section.label}
										onReviewClick={handleReviewClick}
										onToggleCollapse={toggleSection}
										onTopicClick={handleTopicClick}
										reviewEntries={reviewEntries}
										showPreviousCollapsed={prevCollapsed}
										topicEntries={topicEntries}
									/>
								)
							})}

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
