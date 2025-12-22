import { useNavigate } from '@tanstack/react-router'
import { CircleDashed, Home } from 'lucide-react'
import { ReviewListSkeleton } from '~/app/components/ReviewListSkeleton'
import { useReviewSessionPageHandlers } from '~/app/hooks/useReviewSessionPageHandlers'
import { useSectionCollapse } from '~/app/hooks/useSectionCollapse'
import { PageLayout } from '~/app/layouts/PageLayout'
import { EmptyStateCreateTopicButton } from '~/components/EmptyStateCreateTopicButton'
import { Button } from '~/components/ui/Button'
import {
	Empty,
	EmptyContent,
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
		closeReviewDialog,
		handleCreateTopic,
		isCreatingTopic
	} = useReviewSessionPageHandlers()
	const { collapsedSections, toggleSection } = useSectionCollapse()

	const isSectionCollapsed = collapsedSections.unscheduled ?? false
	const hasEntries = reviewSection.entries.length > 0

	return (
		<PageLayout>
			<PageLayout.Header icon={CircleDashed} title='Unscheduled' />
			<UnscheduledList
				hasEntries={hasEntries}
				isCreatingTopic={isCreatingTopic}
				isLoading={reviewsLoading}
				isSectionCollapsed={isSectionCollapsed}
				onCreateTopic={handleCreateTopic}
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
	isCreatingTopic,
	isLoading,
	isSectionCollapsed,
	onCreateTopic,
	onReviewClick,
	onSessionClick,
	onToggleCollapse,
	reviewSection
}: {
	hasEntries: boolean
	isCreatingTopic: boolean
	isLoading: boolean
	isSectionCollapsed: boolean
	onCreateTopic: () => void
	onReviewClick: (reviewId: number) => void
	onSessionClick: (sessionId: number) => void
	onToggleCollapse: (sectionId: string) => void
	reviewSection: {
		headingClassName?: string
		label: string
		entries: Array<ReviewEntry>
	}
}) {
	const navigate = useNavigate()

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
