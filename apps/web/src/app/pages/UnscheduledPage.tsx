import { CircleDashed } from 'lucide-react'
import { ReviewListSkeleton } from '~/app/components/ReviewListSkeleton'
import { useReviewSessionPageHandlers } from '~/app/hooks/useReviewSessionPageHandlers'
import { useSectionCollapse } from '~/app/hooks/useSectionCollapse'
import { PageLayout } from '~/app/layouts/PageLayout'
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import { useUnscheduledReviewEntries } from '~/features/reviews/api/getReviewEntries'
import { ReviewDialog } from '~/features/reviews/components/ReviewDialog'
import {
	type ReviewEntry,
	ReviewSection
} from '~/features/reviews/components/ReviewSection'

export function UnscheduledPage() {
	const { section: reviewSection, isLoading: reviewsLoading } =
		useUnscheduledReviewEntries()

	const {
		handleSessionClick,
		handleReviewClick,
		selectedReviewId,
		closeReviewDialog
	} = useReviewSessionPageHandlers()
	const { collapsedSections, toggleSection } = useSectionCollapse()

	const isSectionCollapsed = collapsedSections.unscheduled ?? false
	const hasEntries = reviewSection.entries.length > 0

	return (
		<PageLayout>
			<PageLayout.Header icon={CircleDashed} title='Unscheduled' />
			<UnscheduledList
				hasEntries={hasEntries}
				isLoading={reviewsLoading}
				isSectionCollapsed={isSectionCollapsed}
				onReviewClick={handleReviewClick}
				onSessionClick={handleSessionClick}
				onToggleCollapse={toggleSection}
				reviewSection={reviewSection}
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

function UnscheduledList({
	hasEntries,
	isLoading,
	isSectionCollapsed,
	onReviewClick,
	onSessionClick,
	onToggleCollapse,
	reviewSection
}: {
	hasEntries: boolean
	isLoading: boolean
	isSectionCollapsed: boolean
	onReviewClick: (reviewId: number) => void
	onSessionClick: (sessionId: number) => void
	onToggleCollapse: (sectionId: string) => void
	reviewSection: {
		headingClassName?: string
		label: string
		entries: Array<ReviewEntry>
	}
}) {
	if (isLoading) {
		return <ReviewListSkeleton />
	}

	if (!hasEntries) {
		return (
			<PageLayout.Content>
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant='icon'>
							<CircleDashed />
						</EmptyMedia>
						<EmptyTitle>Unscheduled reviews will appear here.</EmptyTitle>
					</EmptyHeader>
				</Empty>
			</PageLayout.Content>
		)
	}

	return (
		<PageLayout.Content>
			<div className='mb-2'>
				<ReviewSection
					entries={reviewSection.entries}
					headingClassName={reviewSection.headingClassName}
					id='unscheduled'
					isCollapsed={isSectionCollapsed}
					label={reviewSection.label}
					onReviewClick={onReviewClick}
					onSessionClick={onSessionClick}
					onToggleCollapse={onToggleCollapse}
				/>
			</div>
		</PageLayout.Content>
	)
}
