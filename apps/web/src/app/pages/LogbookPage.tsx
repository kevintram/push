import { ListChecks } from 'lucide-react'
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
import { useLogbookReviewEntries } from '~/features/reviews/api/getReviewEntries'
import { ReviewDialog } from '~/features/reviews/components/ReviewDialog'
import {
	type ReviewEntry,
	ReviewSection
} from '~/features/reviews/components/ReviewSection'

export function LogbookPage() {
	const { sections, isLoading } = useLogbookReviewEntries()

	const {
		handleSessionClick,
		handleReviewClick,
		selectedReviewId,
		closeReviewDialog
	} = useReviewSessionPageHandlers()
	const { collapsedSections, toggleSection } = useSectionCollapse()

	return (
		<PageLayout>
			<PageLayout.Header icon={ListChecks} title='Logbook' />
			<LogbookList
				collapsedSections={collapsedSections}
				isLoading={isLoading}
				onReviewClick={handleReviewClick}
				onSessionClick={handleSessionClick}
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
	onSessionClick,
	onToggleCollapse,
	sections
}: {
	collapsedSections: Record<string, boolean>
	isLoading: boolean
	onReviewClick: (reviewId: number) => void
	onSessionClick: (sessionId: number) => void
	onToggleCollapse: (sectionId: string) => void
	sections: Array<{
		id: string
		label: string
		entries: Array<ReviewEntry>
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
						<EmptyTitle>Completed reviews will appear here.</EmptyTitle>
					</EmptyHeader>
				</Empty>
			</PageLayout.Content>
		)
	}

	return (
		<PageLayout.Content>
			{sections.map(section => (
				<ReviewSection
					entries={section.entries}
					id={section.id}
					isCollapsed={collapsedSections[section.id] ?? false}
					key={section.id}
					label={section.label}
					onReviewClick={onReviewClick}
					onSessionClick={onSessionClick}
					onToggleCollapse={onToggleCollapse}
				/>
			))}
		</PageLayout.Content>
	)
}
