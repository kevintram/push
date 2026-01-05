import { Star } from 'lucide-react'
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
import { useTodayReviewEntries } from '~/features/reviews/api/getReviewEntries'
import { ReviewDialog } from '~/features/reviews/components/ReviewDialog'
import { ReviewSection } from '~/features/reviews/components/ReviewSection'

export function TodayPage() {
	const { sections, isLoading } = useTodayReviewEntries()
	const {
		handleSessionClick,
		handleReviewClick,
		selectedReviewId,
		closeReviewDialog
	} = useReviewSessionPageHandlers()
	const { collapsedSections, toggleSection } = useSectionCollapse()

	const allSectionsEmpty = sections.every(
		section => section.entries.length === 0
	)

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
							<EmptyTitle>Nothing due today.</EmptyTitle>
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
				{sections.map(section => (
					<ReviewSection
						entries={section.entries}
						headingClassName={section.headingClassName}
						id={section.id}
						isCollapsed={collapsedSections[section.id] ?? false}
						key={section.id}
						label={section.label}
						onReviewClick={handleReviewClick}
						onSessionClick={handleSessionClick}
						onToggleCollapse={toggleSection}
					/>
				))}
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
