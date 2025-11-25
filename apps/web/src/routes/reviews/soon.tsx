import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useSoonReviews } from '~/features/reviews/api/useSoonReviews'
import { ReviewPageHeader } from '~/features/reviews/components/ReviewPageHeader'
import { ReviewPageSkeleton } from '~/features/reviews/components/ReviewPageSkeleton'
import { ReviewSection } from '~/features/reviews/components/ReviewSection'
import { useSoonTopics } from '~/features/topics/api/useSoonTopics'
import type { Topic } from '~/models/review-topic.types'

export const Route = createFileRoute('/reviews/soon')({
	component: SoonPage
})

function SoonPage() {
	const { sections: reviewSections, isLoading: reviewsLoading } =
		useSoonReviews()

	const { sections: topicSections, isLoading: topicsLoading } = useSoonTopics()

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
		const sectionOrder = [
			'overdue',
			'today',
			'tomorrow',
			'nextSevenDays',
			'unscheduled'
		]

		return Array.from(sectionMap.values()).sort((a, b) => {
			const aIndex = sectionOrder.indexOf(a.id)
			const bIndex = sectionOrder.indexOf(b.id)
			return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
		})
	}, [reviewSections, topicSections])

	if (reviewsLoading || topicsLoading) {
		return <ReviewPageSkeleton />
	}

	return (
		<div className='scrollbar-track-transparent relative flex h-full w-full flex-col'>
			<div className='flex h-full flex-col overflow-auto bg-primary-foreground'>
				<ReviewPageHeader activeBadge='soon' />
				<div className='px-6'>
					{mergedSections.map((section, index) => {
						const prev = index > 0 ? mergedSections[index - 1] : undefined
						const reviewEntries = section.reviewsData?.entries ?? []
						const topicEntries = section.topicsData?.entries ?? []

						const isSectionCollapsed = collapsedSections[section.id] ?? false
						const prevCollapsed = prev
							? (collapsedSections[prev.id] ?? false)
							: false

						return (
							<ReviewSection
								headingClassName={section.headingClassName}
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
				</div>
			</div>
		</div>
	)
}
