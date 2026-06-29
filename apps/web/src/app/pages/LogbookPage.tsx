import { ListChecks } from 'lucide-react'

import { useReviewPageHandlers } from '~/app/hooks/useReviewPageHandlers'
import { useSectionCollapse } from '~/app/hooks/useSectionCollapse'
import { PageLayout } from '~/app/layouts/PageLayout'
import { useLogbookReviewEntries } from '~/modules/reviews/api/getReviewEntries'
import { ReviewDialog } from '~/modules/reviews/components/ReviewDialog'

import { LogbookList } from './LogbookList'

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
