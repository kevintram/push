import { createFileRoute } from '@tanstack/react-router'
import { ChevronDown, ListChecks } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useLogbookReviews } from '~/features/reviews/api/useLogbookReviews'
import { ReviewItem } from '~/features/reviews/components/ReviewItem'
import { ReviewPageSkeleton } from '~/features/reviews/components/ReviewPageSkeleton'

export const Route = createFileRoute('/logbook')({
	component: LogbookPage
})

function LogbookPage() {
	const { sections, isLoading } = useLogbookReviews()

	const { openReviewDialog } = useReviewTopicDialog()

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

	if (isLoading) {
		return <ReviewPageSkeleton />
	}

	return (
		<div className='scrollbar-track-transparent relative flex h-full w-full flex-col'>
			<div className='flex h-full flex-col overflow-auto'>
				<div className='sticky top-0 z-10 flex flex-col gap-2 rounded-tl-sm border-tl-2 border-b-1 bg-primary-foreground/40 px-4 pt-4 pb-2 backdrop-blur-sm'>
					<div className='flex items-center justify-between'>
						<h1 className='flex items-center gap-2 font-bold text-xl'>
							<ListChecks className='h-5 w-5' />
							Logbook
						</h1>
					</div>
				</div>
				<div className='px-6'>
					{sections.length === 0 ? (
						<p className='mt-8 text-center text-muted-foreground text-sm italic'>
							No completed reviews yet.
						</p>
					) : (
						sections.map((section, index) => {
							const prev = index > 0 ? sections[index - 1] : undefined
							const isSectionCollapsed = collapsedSections[section.id] ?? false
							const prevCollapsed = prev
								? (collapsedSections[prev.id] ?? false)
								: false

							return (
								<div
									className={`mb-2 ${prevCollapsed ? '' : 'mt-12'}`}
									key={section.id}
								>
									<div className='flex items-center justify-between bg-primary-foreground'>
										<Button
											className='-translate-x-3 flex items-center gap-2 p-0'
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
										<div className='mt-2 ml-2 border-border border-l-2 pl-4'>
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
