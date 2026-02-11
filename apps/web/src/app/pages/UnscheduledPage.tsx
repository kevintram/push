import { CircleDashed } from 'lucide-react'
import { ReviewListSkeleton } from '~/app/components/ReviewListSkeleton'
import { useReviewPageHandlers } from '~/app/hooks/useReviewPageHandlers'
import { useSectionCollapse } from '~/app/hooks/useSectionCollapse'
import { PageLayout } from '~/app/layouts/PageLayout'
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { useUnscheduledReviewEntries } from '~/features/reviews/api/getReviewEntries'
import { ReviewDialog } from '~/features/reviews/components/ReviewDialog'
import { ReviewSection } from '~/features/reviews/components/ReviewSection'
import type { ReviewListItem } from '~/features/reviews/types/review.types'

export function UnscheduledPage() {
	const { section: reviewSection, isLoading: reviewsLoading } =
		useUnscheduledReviewEntries()

	const { handleReviewClick, selectedReviewId, closeReviewDialog } =
		useReviewPageHandlers()
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
	onToggleCollapse,
	reviewSection
}: {
	hasEntries: boolean
	isLoading: boolean
	isSectionCollapsed: boolean
	onReviewClick: (reviewId: number) => void
	onToggleCollapse: (sectionId: string) => void
	reviewSection: {
		headingClassName?: string
		label: string
		entries: Array<ReviewListItem>
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
						<EmptyTitle>No unscheduled reviews</EmptyTitle>
						<EmptyDescription>
							See all reviews without a due date
						</EmptyDescription>
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
					onToggleCollapse={onToggleCollapse}
				/>
			</div>
		</PageLayout.Content>
	)
}
