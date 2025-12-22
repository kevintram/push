import { useNavigate } from '@tanstack/react-router'
import { Calendar, Home } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ReviewListSkeleton } from '~/app/components/ReviewListSkeleton'
import { useReviewSessionPageHandlers } from '~/app/hooks/useReviewSessionPageHandlers'
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
import {
	useFutureReviewSessions,
	useSoonReviewSessions
} from '~/features/reviews/api/getReviewSessions'
import { ReviewSection } from '~/features/reviews/components/ReviewSection'
import type { ReviewSession } from '~/features/reviews/types/review.types'

export function UpcomingPage() {
	const [showFuture, setShowFuture] = useState(false)

	// Always fetch soon data (tomorrow + next 7 days)
	const { sections: soonReviewSections, isLoading: soonReviewsLoading } =
		useSoonReviewSessions()

	// Conditionally fetch future data (8+ days, monthly groups)
	const {
		sections: futureReviewSections = [],
		isLoading: futureReviewsLoading,
		isFetched: futureReviewsFetched
	} = useFutureReviewSessions({ enabled: showFuture })

	useEffect(() => {
		if (futureReviewsFetched) {
			setShowFuture(true)
		}
	}, [futureReviewsFetched])

	useEffect(() => {
		const totalEntries = soonReviewSections.reduce(
			(sum, section) => sum + section.entries.length,
			0
		)
		if (totalEntries < 20) {
			setShowFuture(true)
		}
	}, [soonReviewSections])

	const { handleReviewClick, handleCreateTopic, isCreatingTopic } =
		useReviewSessionPageHandlers()
	const { collapsedSections, toggleSection } = useSectionCollapse()

	// Combine all sections
	const allSections = useMemo(() => {
		const combined = [...soonReviewSections, ...futureReviewSections]
		// Filter out empty sections except for required ones
		return combined.filter(section => {
			const entries = section.entries ?? []
			return (
				entries.length > 0 ||
				section.id === 'tomorrow' ||
				section.id === 'nextSevenDays'
			)
		})
	}, [soonReviewSections, futureReviewSections])

	const isInitialLoading = soonReviewsLoading

	// Check if all sections are empty
	const allSectionsEmpty = allSections.every(section => {
		return (section.entries ?? []).length === 0
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
				isMonthlyLoading={futureReviewsLoading}
				onCreateTopic={handleCreateTopic}
				onReviewClick={handleReviewClick}
				onShowMore={() => setShowFuture(true)}
				onToggleCollapse={toggleSection}
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
	showFuture
}: {
	allSections: Array<{
		id: string
		label: string
		entries: Array<ReviewSession>
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
						<EmptyTitle>Scheduled reviews will appear here.</EmptyTitle>
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
					entries={section.entries}
					id={section.id}
					isCollapsed={collapsedSections[section.id] ?? false}
					key={section.id}
					label={section.label}
					onReviewClick={onReviewClick}
					onToggleCollapse={onToggleCollapse}
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
