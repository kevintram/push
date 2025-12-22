import { useNavigate } from '@tanstack/react-router'
import { ArrowUpRight, Home, Star } from 'lucide-react'
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
import { ReviewSection } from '~/features/reviews/components/ReviewSection'
import type { ReviewSession } from '~/features/reviews/types/review.types'

export function TodayPage() {
	const { sections: reviewSections, isLoading: reviewsLoading } =
		useTodayReviewSessions()

	const { handleReviewClick, handleCreateTopic, isCreatingTopic } =
		useReviewSessionPageHandlers()
	const { collapsedSections, toggleSection } = useSectionCollapse()

	// Check if all sections are empty
	const allSectionsEmpty = reviewSections.every(section => {
		const reviewEntries = section.entries ?? []
		return reviewEntries.length === 0
	})

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
				onToggleCollapse={toggleSection}
				reviewSections={reviewSections}
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
		entries: Array<ReviewSession>
	}>
	onCreateTopic: () => void
	onReviewClick: (reviewId: number) => void
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
					onToggleCollapse={onToggleCollapse}
				/>
			))}
		</PageLayout.Content>
	)
}
