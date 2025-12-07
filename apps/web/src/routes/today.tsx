import { createFileRoute } from '@tanstack/react-router'
import { Star } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { PageHeader } from '~/components/PageHeader'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { ReviewPageSkeleton } from '~/features/reviews/components/ReviewPageSkeleton'
import { ReviewSection } from '~/features/reviews/components/ReviewSection'
import { useTodayReviews } from '~/features/reviews/hooks/useTodayReviews'
import { useTodayTopics } from '~/features/topics/hooks/useTodayTopics'
import type { Topic } from '~/models/review-topic.types'

export const Route = createFileRoute('/today')({
	component: TodayPage
})

function TodayPage() {
	const { sections: reviewSections, isLoading: reviewsLoading } =
		useTodayReviews()

	const { sections: topicSections, isLoading: topicsLoading } = useTodayTopics()

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

	return (
		<div className='scrollbar-track-transparent relative flex h-full w-full flex-col'>
			<div className='flex h-full flex-col overflow-auto'>
				<PageHeader icon={Star} title='Today' />
				<div className='p-4'>
					{mergedSections.map(section => (
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
					))}
				</div>
			</div>
		</div>
	)
}
