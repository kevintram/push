import { useNavigate } from '@tanstack/react-router'
import { Calendar, Home, Star } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ReviewListSkeleton } from '~/app/components/ReviewListSkeleton'
import { useReviewSessionPageHandlers } from '~/app/hooks/useReviewSessionPageHandlers'
import { useSectionCollapse } from '~/app/hooks/useSectionCollapse'
import { PageLayout } from '~/app/layouts/PageLayout'
import { EmptyStateCreateTopicButton } from '~/components/EmptyStateCreateTopicButton'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import {
	Empty,
	EmptyContent,
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
import { getCookie, setCookie } from '~/utils/cookies'

const SCHEDULED_TODAY_FILTER_COOKIE = 'scheduled-today-filter'

export function ScheduledPage() {
	const [showFuture, setShowFuture] = useState(false)
	const [todayFilter, setTodayFilter] = useState<boolean>(() => {
		const saved = getCookie<boolean>(SCHEDULED_TODAY_FILTER_COOKIE)
		return saved ?? false
	})

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
	} = useFutureReviewEntries({ enabled: showFuture && !todayFilter })

	useEffect(() => {
		if (futureReviewsFetched) {
			setShowFuture(true)
		}
	}, [futureReviewsFetched])

	useEffect(() => {
		if (todayFilter) return // Don't auto-fetch future when filter is on

		const totalEntries = soonReviewSections.reduce(
			(sum, section) => sum + section.entries.length,
			0
		)
		if (totalEntries < 20) {
			setShowFuture(true)
		}
	}, [soonReviewSections, todayFilter])

	const {
		handleSessionClick,
		handleReviewClick,
		selectedReviewId,
		closeReviewDialog,
		handleCreateTopic,
		isCreatingTopic
	} = useReviewSessionPageHandlers()
	const { collapsedSections, toggleSection } = useSectionCollapse()

	const toggleTodayFilter = useCallback(() => {
		setTodayFilter(prev => {
			const newValue = !prev
			setCookie(SCHEDULED_TODAY_FILTER_COOKIE, newValue)
			return newValue
		})
	}, [])

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

		// If not filtering to today only, add soon and future sections
		if (!todayFilter) {
			for (const section of soonReviewSections) {
				sections.push({
					id: section.id,
					label: section.label,
					headingClassName: section.headingClassName,
					entries: section.entries
				})
			}

			for (const section of futureReviewSections) {
				sections.push({
					id: section.id,
					label: section.label,
					entries: section.entries
				})
			}
		}

		// Filter out empty sections except for required ones
		return sections.filter(section => {
			if (section.entries.length > 0) return true

			// Keep overdue and today when filtering
			if (todayFilter) {
				return section.id === 'overdue' || section.id === 'today'
			}

			// Keep tomorrow and nextSevenDays when not filtering
			return (
				section.id === 'overdue' ||
				section.id === 'today' ||
				section.id === 'tomorrow' ||
				section.id === 'nextSevenDays'
			)
		})
	}, [todaySections, soonReviewSections, futureReviewSections, todayFilter])

	const isInitialLoading = todayLoading || soonReviewsLoading

	// Check if all sections are empty
	const allSectionsEmpty = allSections.every(
		section => section.entries.length === 0
	)

	return (
		<PageLayout>
			<PageLayout.Header icon={Calendar} title='Scheduled'>
				<Badge
					className='cursor-pointer select-none'
					onClick={toggleTodayFilter}
					variant={todayFilter ? 'default' : 'outline'}
				>
					<Star className='h-3 w-3' />
					Today
				</Badge>
			</PageLayout.Header>
			<ScheduledList
				allSections={allSections}
				allSectionsEmpty={allSectionsEmpty}
				collapsedSections={collapsedSections}
				isCreatingTopic={isCreatingTopic}
				isInitialLoading={isInitialLoading}
				isMonthlyLoading={futureReviewsLoading}
				onCreateTopic={handleCreateTopic}
				onReviewClick={handleReviewClick}
				onSessionClick={handleSessionClick}
				onShowMore={() => setShowFuture(true)}
				onToggleCollapse={toggleSection}
				showFuture={showFuture}
				todayFilter={todayFilter}
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

function ScheduledList({
	allSections,
	allSectionsEmpty,
	collapsedSections,
	isCreatingTopic,
	isInitialLoading,
	isMonthlyLoading,
	onCreateTopic,
	onReviewClick,
	onSessionClick,
	onShowMore,
	onToggleCollapse,
	showFuture,
	todayFilter
}: {
	allSections: Array<{
		id: string
		label: string
		headingClassName?: string
		entries: Array<ReviewEntry>
	}>
	allSectionsEmpty: boolean
	collapsedSections: Record<string, boolean>
	isCreatingTopic: boolean
	isInitialLoading: boolean
	isMonthlyLoading: boolean
	onCreateTopic: () => void
	onReviewClick: (reviewId: number) => void
	onSessionClick: (sessionId: number) => void
	onShowMore: () => void
	onToggleCollapse: (sectionId: string) => void
	showFuture: boolean
	todayFilter: boolean
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
							{todayFilter
								? 'Nothing due today.'
								: 'Scheduled reviews will appear here.'}
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

			{/* Show More button (only when not filtering to today) */}
			{!(todayFilter || showFuture) && (
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
