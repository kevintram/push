import { Star } from 'lucide-react'
import { ReviewListSkeleton } from '~/app/components/ReviewListSkeleton'
import { useReviewSessionPageHandlers } from '~/app/hooks/useReviewSessionPageHandlers'
import { useSectionCollapse } from '~/app/hooks/useSectionCollapse'
import { PageLayout } from '~/app/layouts/PageLayout'
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import { useMergedTodayReviewEntries } from '~/features/reviews/api/getReviewEntries'
import { ReviewDialog } from '~/features/reviews/components/ReviewDialog'
import { ReviewSection } from '~/features/reviews/components/ReviewSection'

export function TodayPage() {
	const { entries, isLoading } = useMergedTodayReviewEntries()
	const {
		handleSessionClick,
		handleReviewClick,
		selectedReviewId,
		closeReviewDialog
	} = useReviewSessionPageHandlers()
	const { collapsedSections, toggleSection } = useSectionCollapse()

	const allSectionsEmpty = entries.length === 0

	const mergedSection = {
		id: 'today',
		label: 'Today',
		entries
	}

	if (isLoading) {
		return (
			<PageLayout>
				<PageLayout.Header icon={Star} title='Today' />
				<ReviewListSkeleton />
			</PageLayout>
		)
	}

	if (allSectionsEmpty) {
		return (
			<PageLayout>
				<PageLayout.Header icon={Star} title='Today' />
				<PageLayout.Content>
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant='icon'>
								<Star />
							</EmptyMedia>
							<EmptyTitle>Nothing for today</EmptyTitle>
							<EmptyDescription>
								See all reviews completed or due today
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				</PageLayout.Content>
			</PageLayout>
		)
	}

	return (
		<PageLayout>
			<PageLayout.Header icon={Star} title='Today' />
			<PageLayout.Content>
				<ReviewSection
					entries={mergedSection.entries}
					id={mergedSection.id}
					isCollapsed={collapsedSections[mergedSection.id] ?? false}
					label={mergedSection.label}
					onReviewClick={handleReviewClick}
					onSessionClick={handleSessionClick}
					onToggleCollapse={toggleSection}
				/>
			</PageLayout.Content>
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
