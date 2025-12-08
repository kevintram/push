import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronDown, Home, ListChecks } from 'lucide-react'
import { useCallback, useState } from 'react'
import { EmptyStateCreateTopicButton } from '~/components/EmptyStateCreateTopicButton'
import { PageHeader } from '~/components/PageHeader'
import { Button } from '~/components/ui/Button'
import {
	Empty,
	EmptyContent,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useCreateTopicWithReview } from '~/features/reviews/api/createTopicReview'
import { useLogbookReviews } from '~/features/reviews/api/getReviews'
import { ReviewItem } from '~/features/reviews/components/ReviewItem'
import { ReviewPageSkeleton } from '~/features/reviews/components/ReviewPageSkeleton'

export const Route = createFileRoute('/logbook')({
	component: LogbookPage
})

function LogbookPage() {
	const navigate = useNavigate()
	const { sections, isLoading } = useLogbookReviews()

	const { openReviewDialog, openTopicDialog } = useReviewTopicDialog()
	const { createTopicWithReview, isTopicCreatePending: isCreatingTopic } =
		useCreateTopicWithReview()

	const [collapsedSections, setCollapsedSections] = useState<
		Record<string, boolean>
	>({})

	const toggleSection = useCallback((sectionId: string) => {
		setCollapsedSections(prev => ({
			...prev,
			[sectionId]: !prev[sectionId]
		}))
	}, [])

	const handleReviewClick = useCallback(
		(reviewId: number) => {
			openReviewDialog(reviewId)
		},
		[openReviewDialog]
	)

	const handleCreateTopic = useCallback(async () => {
		const createdTopic = await createTopicWithReview({})
		openTopicDialog(createdTopic.id)
	}, [createTopicWithReview, openTopicDialog])

	if (isLoading) {
		return <ReviewPageSkeleton />
	}

	return (
		<div className='scrollbar-track-transparent relative flex h-full w-full flex-col'>
			<div className='flex h-full flex-col overflow-auto'>
				<PageHeader icon={ListChecks} title='Logbook' />
				<div className='p-4'>
					{sections.length === 0 ? (
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
										onClick={handleCreateTopic}
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
					) : (
						sections.map(section => {
							const isSectionCollapsed = collapsedSections[section.id] ?? false
							return (
								<div className='mb-2' key={section.id}>
									<div className='flex items-center justify-between bg-primary-foreground'>
										<Button
											className='flex items-center gap-2 p-0'
											onClick={() => toggleSection(section.id)}
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
														onReviewClick={handleReviewClick}
													/>
												))}
											</div>
										</div>
									)}
								</div>
							)
						})
					)}
				</div>
			</div>
		</div>
	)
}
