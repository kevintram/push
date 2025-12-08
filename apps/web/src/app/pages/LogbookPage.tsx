import { useNavigate } from '@tanstack/react-router'
import { ChevronDown, Home, ListChecks } from 'lucide-react'
import { useReviewPageHandlers } from '~/app/hooks/useReviewPageHandlers'
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
import { useLogbookReviews } from '~/features/reviews/api/getReviews'
import { ReviewItem } from '~/features/reviews/components/ReviewItem'
import { ReviewPageSkeleton } from '~/features/reviews/components/ReviewPageSkeleton'
import type { Review } from '~/models/review-topic.types'

export function LogbookPage() {
	const { sections, isLoading } = useLogbookReviews()

	const { handleReviewClick, handleCreateTopic, isCreatingTopic } =
		useReviewPageHandlers()
	const { collapsedSections, toggleSection } = useSectionCollapse()

	if (isLoading) {
		return <ReviewPageSkeleton />
	}

	return (
		<PageLayout>
			<PageLayout.Header icon={ListChecks} title='Logbook' />
			<LogbookList
				collapsedSections={collapsedSections}
				isCreatingTopic={isCreatingTopic}
				onCreateTopic={handleCreateTopic}
				onReviewClick={handleReviewClick}
				onToggleCollapse={toggleSection}
				sections={sections}
			/>
		</PageLayout>
	)
}

function LogbookList({
	collapsedSections,
	isCreatingTopic,
	onCreateTopic,
	onReviewClick,
	onToggleCollapse,
	sections
}: {
	collapsedSections: Record<string, boolean>
	isCreatingTopic: boolean
	onCreateTopic: () => void
	onReviewClick: (reviewId: number) => void
	onToggleCollapse: (sectionId: string) => void
	sections: Array<{
		id: string
		label: string
		entries: Array<Review>
	}>
}) {
	const navigate = useNavigate()

	if (sections.length === 0) {
		return (
			<div className='p-4'>
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant='icon'>
							<ListChecks />
						</EmptyMedia>
						<EmptyTitle>Completed reviews will appear here.</EmptyTitle>
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
			</div>
		)
	}

	return (
		<div className='p-4'>
			{sections.map(section => {
				const isSectionCollapsed = collapsedSections[section.id] ?? false
				return (
					<div className='mb-2' key={section.id}>
						<div className='flex items-center justify-between bg-primary-foreground'>
							<Button
								className='flex items-center gap-2 p-0'
								onClick={() => onToggleCollapse(section.id)}
								variant='ghost'
							>
								<h2 className='font-bold text-lg'>{section.label}</h2>
								<ChevronDown
									className={`h-5 w-5 transition-transform ${isSectionCollapsed ? '-rotate-90' : ''}`}
								/>
							</Button>
						</div>

						{!isSectionCollapsed && (
							<div className='mt-2 mb-10 ml-5 border-border border-l-2 pl-4'>
								<h3 className='font-semibold text-md'>
									Reviews{' '}
									<span className='text-muted-foreground'>
										({section.entries.length})
									</span>
								</h3>
								<div className='mt-2'>
									{section.entries.map(entry => (
										<ReviewItem
											entry={entry}
											key={entry.id}
											onReviewClick={onReviewClick}
										/>
									))}
								</div>
							</div>
						)}
					</div>
				)
			})}
		</div>
	)
}
