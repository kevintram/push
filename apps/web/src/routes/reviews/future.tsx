import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useFutureReviews } from '~/features/reviews/api/useFutureReviews'
import { ReviewPageSkeleton } from '~/features/reviews/components/ReviewPageSkeleton'
import { ReviewSection } from '~/features/reviews/components/ReviewSection'
import { useFutureTopics } from '~/features/topics/api/useFutureTopics'
import type { Topic } from '~/models/review-topic.types'

export const Route = createFileRoute('/reviews/future')({
	component: FuturePage
})

function FuturePage() {
	const { sections: reviewSections, isLoading: reviewsLoading } =
		useFutureReviews()

	const { sections: topicSections, isLoading: topicsLoading } =
		useFutureTopics()

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

	// Merge sections by matching month IDs
	const mergedSections = useMemo(() => {
		const sectionMap = new Map<
			string,
			{
				id: string
				label: string
				reviewsData?: (typeof reviewSections)[0]
				topicsData?: (typeof topicSections)[0]
			}
		>()

		// Add review sections
		for (const section of reviewSections) {
			sectionMap.set(section.id, {
				id: section.id,
				label: section.label,
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
					topicsData: section
				})
			}
		}

		// Convert to array and sort by month key ascending (earliest first)
		return Array.from(sectionMap.values()).sort((a, b) =>
			a.id.localeCompare(b.id)
		)
	}, [reviewSections, topicSections])

	if (reviewsLoading || topicsLoading) {
		return <ReviewPageSkeleton />
	}

	return (
		<div className='scrollbar-track-transparent relative flex h-full w-full flex-col'>
			<div className='flex h-full flex-col overflow-auto'>
				<div className='sticky top-0 z-10 flex flex-col gap-2 rounded-tl-sm border-tl-2 border-b-1 bg-primary-foreground/40 px-4 pt-4 pb-2 backdrop-blur-sm'>
					<div className='flex items-center justify-between'>
						<h1 className='font-bold text-xl'>Future</h1>
					</div>
				</div>
				<div className='px-6'>
					{mergedSections.length === 0 ? (
						<p className='mt-8 text-center text-muted-foreground text-sm italic'>
							No future reviews or topics yet.
						</p>
					) : (
						mergedSections.map((section, index) => {
							const prev = index > 0 ? mergedSections[index - 1] : undefined
							const reviewEntries = section.reviewsData?.entries ?? []
							const topicEntries = section.topicsData?.entries ?? []

							const isSectionCollapsed = collapsedSections[section.id] ?? false
							const prevCollapsed = prev
								? (collapsedSections[prev.id] ?? false)
								: false

							return (
								<ReviewSection
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
						})
					)}
				</div>
			</div>
		</div>
	)
}
