import { useNavigate } from '@tanstack/react-router'
import { ChevronDown, Home, ListChecks } from 'lucide-react'
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
import { useLogbookReviewSessions } from '~/features/reviews/api/getReviewSessions'
import { ReviewSessionItem } from '~/features/reviews/components/ReviewSessionItem'
import type { ReviewSession } from '~/features/reviews/types/review.types'

export function LogbookPage() {
	const { sections, isLoading } = useLogbookReviewSessions()

	const { handleReviewClick, handleCreateTopic, isCreatingTopic } =
		useReviewSessionPageHandlers()
	const { collapsedSections, toggleSection } = useSectionCollapse()

	return (
		<PageLayout>
			<PageLayout.Header icon={ListChecks} title='Logbook' />
			<LogbookList
				collapsedSections={collapsedSections}
				isCreatingTopic={isCreatingTopic}
				isLoading={isLoading}
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
	isLoading,
	onCreateTopic,
	onReviewClick,
	onToggleCollapse,
	sections
}: {
	collapsedSections: Record<string, boolean>
	isCreatingTopic: boolean
	isLoading: boolean
	onCreateTopic: () => void
	onReviewClick: (reviewId: number) => void
	onToggleCollapse: (sectionId: string) => void
	sections: Array<{
		id: string
		label: string
		entries: Array<ReviewSession>
	}>
}) {
	const navigate = useNavigate()

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
										<ReviewSessionItem
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
		</PageLayout.Content>
	)
}
