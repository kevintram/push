import { useNavigate } from '@tanstack/react-router'
import { ArrowUpRight, Home, Star } from 'lucide-react'
import { useMemo } from 'react'
import { ReviewListSkeleton } from '~/app/components/ReviewListSkeleton'
import { useReviewSessionPageHandlers } from '~/app/hooks/useReviewSessionPageHandlers'
import { useSectionCollapse } from '~/app/hooks/useSectionCollapse'
import { PageLayout } from '~/app/layouts/PageLayout'
import { EmptyStateCreateTopicButton } from '~/components/EmptyStateCreateTopicButton'
import { Button } from '~/components/ui/Button'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import { useTodayReviewSessions } from '~/features/reviews/api/getReviewSessions'
import { ReviewDialog } from '~/features/reviews/components/ReviewDialog'
import {
	ReviewSection,
	type ReviewEntry
} from '~/features/reviews/components/ReviewSection'

export function TodayPage() {
	const { sections: reviewSections, isLoading: reviewsLoading } =
		useTodayReviewSessions()

	const {
		handleSessionClick,
		handleReviewClick,
		selectedReviewId,
		closeReviewDialog,
		handleCreateTopic,
		isCreatingTopic
	} = useReviewSessionPageHandlers()
	const { collapsedSections, toggleSection } = useSectionCollapse()

	// Convert ReviewSession[] to ReviewEntry[]
	const sectionsWithEntries = useMemo(() => {
		return reviewSections.map(section => ({
			...section,
			entries: section.entries.map(
				(session): ReviewEntry => ({
					type: 'session' as const,
					data: session
				})
			)
		}))
	}, [reviewSections])

	// Check if all sections are empty
	const allSectionsEmpty = sectionsWithEntries.every(
		section => section.entries.length === 0
	)

	return (
		<PageLayout>
			<PageLayout.Header icon={Star} title='Today' />
			<TodayList
				allSectionsEmpty={allSectionsEmpty}
				collapsedSections={collapsedSections}
				isCreatingTopic={isCreatingTopic}
				isLoading={reviewsLoading}
				onCreateTopic={handleCreateTopic}
				onReviewClick={handleReviewClick}
				onSessionClick={handleSessionClick}
				onToggleCollapse={toggleSection}
				reviewSections={sectionsWithEntries}
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

function TodayList({
	allSectionsEmpty,
	collapsedSections,
	isCreatingTopic,
	isLoading,
	reviewSections,
	onCreateTopic,
	onReviewClick,
	onSessionClick,
	onToggleCollapse
}: {
	allSectionsEmpty: boolean
	collapsedSections: Record<string, boolean>
	isCreatingTopic: boolean
	isLoading: boolean
	reviewSections: Array<{
		id: string
		label: string
		headingClassName?: string
		entries: Array<ReviewEntry>
	}>
	onCreateTopic: () => void
	onReviewClick: (reviewId: number) => void
	onSessionClick: (sessionId: number) => void
	onToggleCollapse: (sectionId: string) => void
}) {
	const navigate = useNavigate()

	if (isLoading) {
		return <ReviewListSkeleton />
	}

	if (allSectionsEmpty) {
		return (
			<PageLayout.Content>
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant='icon'>
							<Star />
						</EmptyMedia>
						<EmptyTitle>Nothing due today.</EmptyTitle>
						<EmptyDescription>
							Scheduled reviews for today will appear here.
						</EmptyDescription>
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
						<div className='flex gap-2'>
							<Button
								onClick={() => navigate({ to: '/upcoming' })}
								variant='link'
							>
								Check upcoming
								<ArrowUpRight />
							</Button>
						</div>
					</EmptyHeader>
				</Empty>
			</PageLayout.Content>
		)
	}

	return (
		<PageLayout.Content>
			{reviewSections.map(section => (
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
		</PageLayout.Content>
	)
}
