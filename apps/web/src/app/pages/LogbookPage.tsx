import { ListChecks } from 'lucide-react'
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
import { useLogbookReviewEntries } from '~/features/reviews/api/getReviewEntries'
import { ReviewDialog } from '~/features/reviews/components/ReviewDialog'
import { ReviewSection } from '~/features/reviews/components/ReviewSection'
import type { ReviewListItem } from '~/features/reviews/types/review.types'

export function LogbookPage() {
	const { sections, isLoading } = useLogbookReviewEntries()

	const { handleReviewClick, selectedReviewId, closeReviewDialog } =
		useReviewPageHandlers()
	const { collapsedSections, toggleSection } = useSectionCollapse()

	return (
		<PageLayout>
			<PageLayout.Header icon={ListChecks} title='Logbook' />
			<LogbookList
				collapsedSections={collapsedSections}
				isLoading={isLoading}
				onReviewClick={handleReviewClick}
				onToggleCollapse={toggleSection}
				sections={sections}
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

function LogbookList({
	collapsedSections,
	isLoading,
	onReviewClick,
	onToggleCollapse,
	sections
}: {
	collapsedSections: Record<string, boolean>
	isLoading: boolean
	onReviewClick: (reviewId: number) => void
	onToggleCollapse: (sectionId: string) => void
	sections: Array<{
		id: string
		label: string
		entries: Array<ReviewListItem>
	}>
}) {
	if (isLoading) {
		return <ReviewListSkeleton />
	}

	if (sections.length === 0) {
		return (
			<PageLayout.Content>
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant='icon'>
							<ListChecks />
						</EmptyMedia>
						<EmptyTitle>No completed reviews</EmptyTitle>
						<EmptyDescription>
							Completed reviews will appear here
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</PageLayout.Content>
		)
	}

	return (
		<PageLayout.Content>
			{sections.map(section => (
				<ReviewSection
					dateFormat='short'
					entries={section.entries}
					id={section.id}
					isCollapsed={collapsedSections[section.id] ?? false}
					key={section.id}
					label={section.label}
					onReviewClick={onReviewClick}
					onToggleCollapse={onToggleCollapse}
				/>
			))}
		</PageLayout.Content>
	)
}
