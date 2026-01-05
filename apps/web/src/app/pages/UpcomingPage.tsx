import { Calendar } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ReviewListSkeleton } from '~/app/components/ReviewListSkeleton'
import { useReviewSessionPageHandlers } from '~/app/hooks/useReviewSessionPageHandlers'
import { useSectionCollapse } from '~/app/hooks/useSectionCollapse'
import { PageLayout } from '~/app/layouts/PageLayout'
import { Button } from '~/components/ui/Button'
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import {
	useFutureReviewEntries,
	useSoonReviewEntries,
	useTodayReviewEntries
} from '~/features/reviews/api/getReviewEntries'
import { ReviewDialog } from '~/features/reviews/components/ReviewDialog'
import {
	type ReviewEntry,
	ReviewSection
} from '~/features/reviews/components/ReviewSection'
export function UpcomingPage() {
	const [showFuture, setShowFuture] = useState(false)

	// Fetch today data (overdue + today)
	const { sections: todaySections, isLoading: todayLoading } =
		useTodayReviewEntries()

	// Fetch soon data (tomorrow + next 7 days)
	const { sections: soonReviewSections, isLoading: soonReviewsLoading } =
		useSoonReviewEntries()

	// Conditionally fetch future data (8+ days, monthly groups)
	const {
		sections: futureReviewSections = [],
		isLoading: futureReviewsLoading,
		isFetched: futureReviewsFetched
	} = useFutureReviewEntries({ enabled: showFuture })

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

	const {
		handleSessionClick,
		handleReviewClick,
		selectedReviewId,
		closeReviewDialog
	} = useReviewSessionPageHandlers()
	const { collapsedSections, toggleSection } = useSectionCollapse()

	// Combine all sections (entries are already in ReviewEntry format from the hooks)
	const allSections = useMemo(() => {
		type NormalizedSection = {
			id: string
			label: string
			headingClassName?: string
			entries: Array<ReviewEntry>
		}

		const sections: Array<NormalizedSection> = []

		// Add today sections (Overdue, Today)
		for (const section of todaySections) {
			sections.push({
				id: section.id,
				label: section.label,
				headingClassName: section.headingClassName,
				entries: section.entries
			})
		}

		// Add soon sections (Tomorrow, Next 7 Days)
		for (const section of soonReviewSections) {
			sections.push({
				id: section.id,
				label: section.label,
				headingClassName: section.headingClassName,
				entries: section.entries
			})
		}

		// Add future sections (monthly groups)
		for (const section of futureReviewSections) {
			sections.push({
				id: section.id,
				label: section.label,
				entries: section.entries
			})
		}

		// Filter out empty sections except for required ones
		return sections.filter(section => {
			if (section.entries.length > 0) return true

			return (
				section.id === 'overdue' ||
				section.id === 'today' ||
				section.id === 'tomorrow' ||
				section.id === 'nextSevenDays'
			)
		})
	}, [todaySections, soonReviewSections, futureReviewSections])

	const isInitialLoading = todayLoading || soonReviewsLoading

	// Check if all sections are empty
	const allSectionsEmpty = allSections.every(
		section => section.entries.length === 0
	)

	return (
		<PageLayout>
			<PageLayout.Header icon={Calendar} title='Upcoming' />
			<UpcomingList
				allSections={allSections}
				allSectionsEmpty={allSectionsEmpty}
				collapsedSections={collapsedSections}
				isInitialLoading={isInitialLoading}
				isMonthlyLoading={futureReviewsLoading}
				onReviewClick={handleReviewClick}
				onSessionClick={handleSessionClick}
				onShowMore={() => setShowFuture(true)}
				onToggleCollapse={toggleSection}
				showFuture={showFuture}
			/>
			<ReviewDialog
				onOpenChange={open => {
					if (!open) closeReviewDialog()
				}}
				open={selectedReviewId !== null}
				reviewId={selectedReviewId}
			/>
		</PageLayout>
	)
}

function UpcomingList({
	allSections,
	allSectionsEmpty,
	collapsedSections,
	isInitialLoading,
	isMonthlyLoading,
	onReviewClick,
	onSessionClick,
	onShowMore,
	onToggleCollapse,
	showFuture
}: {
	allSections: Array<{
		id: string
		label: string
		headingClassName?: string
		entries: Array<ReviewEntry>
	}>
	allSectionsEmpty: boolean
	collapsedSections: Record<string, boolean>
	isInitialLoading: boolean
	isMonthlyLoading: boolean
	onReviewClick: (reviewId: number) => void
	onSessionClick: (sessionId: number) => void
	onShowMore: () => void
	onToggleCollapse: (sectionId: string) => void
	showFuture: boolean
}) {
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
				</Empty>
			</PageLayout.Content>
		)
	}

	return (
		<PageLayout.Content>
			{allSections.map(section => (
				<ReviewSection
					entries={section.entries}
					headingClassName={section.headingClassName}
					id={section.id}
					isCollapsed={collapsedSections[section.id] ?? false}
					key={section.id}
					label={section.label}
					onReviewClick={onReviewClick}
					onSessionClick={onSessionClick}
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
