import { ListChecks } from 'lucide-react'

import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '~/components/ui/empty'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { ReviewSection } from '~/modules/reviews/components/ReviewSection'
import { type ReviewListItem } from '~/modules/reviews/types/review.types'

import { PageLayout } from '../layouts/PageLayout'

type LogbookListProps = {
	collapsedSections: Record<string, boolean>
	isLoading: boolean
	onReviewClick: (reviewId: number) => void
	onToggleCollapse: (sectionId: string) => void
	sections: Array<{
		id: string
		label: string
		entries: Array<ReviewListItem>
	}>
}

export function LogbookList({
	collapsedSections,
	isLoading,
	onReviewClick,
	onToggleCollapse,
	sections,
}: LogbookListProps) {
	if (isLoading) {
		return (
			<PageLayout.Content>
				<LoadingSpinner containerClassName='min-h-64' />
			</PageLayout.Content>
		)
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
