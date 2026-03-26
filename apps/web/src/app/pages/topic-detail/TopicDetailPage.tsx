import { notFound } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'
import { LoadingOrError } from '~/components/LoadingOrError'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle
} from '~/components/ui/alert-dialog'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { isHttpStatusError } from '~/utils/httpStatusError'
import type { TopicDetailReviewCardFilter } from './shared'
import { TopicDetailHeader } from './TopicDetailHeader'
import { TopicDocumentOutline } from './TopicDocumentOutline'
import { TopicDocumentPageHeader } from './TopicDocumentPageHeader'
import { TopicDocumentSection } from './TopicDocumentSection'
import { useTopicDocumentPage } from './useTopicDocumentPage'

type TopicDetailPageProps = {
	cardTypeFilter?: TopicDetailReviewCardFilter | string
	onCardTypeFilterChange: (filter: TopicDetailReviewCardFilter) => void
	topicId: number
}

export function TopicDetailPage({
	cardTypeFilter = 'all',
	onCardTypeFilterChange,
	topicId
}: TopicDetailPageProps) {
	const {
		activeSectionId,
		ancestorIdsById,
		collapsedSections,
		getScrollElement,
		handleDeleteTopic,
		handleGlobalFilterChange,
		handleOpenReviewCard,
		handleSectionFilterChange,
		isDeleteDialogOpen,
		isDeletingTopic,
		isDocumentLoading,
		nodeById,
		registerSectionRef,
		resolvedCardTypeFilter,
		rootSection,
		scrollContainerRef,
		scrollToSection,
		sectionFilterOverrides,
		setIsDeleteDialogOpen,
		shouldAutoFocusRootTitle,
		toggleSection,
		topic,
		topicError,
		topicPath,
		topicReviewCardsById
	} = useTopicDocumentPage({
		cardTypeFilter,
		onCardTypeFilterChange,
		topicId
	})

	if (isDocumentLoading) {
		return (
			<div className='flex h-full min-h-0 w-full items-center justify-center'>
				<LoadingSpinner containerClassName='min-h-64' />
			</div>
		)
	}

	if (topicError) {
		if (isHttpStatusError(topicError) && topicError.status === 404) {
			throw notFound()
		}

		return (
			<LoadingOrError
				error={
					topicError instanceof Error
						? topicError
						: new Error('Failed to load topic')
				}
			/>
		)
	}

	if (!(topic && rootSection)) {
		throw notFound()
	}

	return (
		<div className='flex h-full min-h-0 w-full'>
			<div className='flex min-h-0 min-w-0 flex-1 flex-col'>
				<div className='border-border/60 border-b bg-background/95 md:hidden'>
					<div className='mx-auto flex w-full max-w-[110rem] items-center justify-end px-4 py-2 sm:px-6 xl:px-8'>
						<TopicDetailHeader activeTopicId={topic.id} />
					</div>
				</div>
				<div className='flex-1 overflow-y-auto' ref={scrollContainerRef}>
					<div className='mx-auto flex w-full max-w-[110rem] items-start gap-6 px-4 py-6 sm:px-6 xl:gap-8 xl:px-8 xl:py-7'>
						<div className='min-w-0 flex-1 space-y-6 xl:space-y-7'>
							<TopicDocumentPageHeader
								onOpenDeleteDialog={() => setIsDeleteDialogOpen(true)}
								shouldAutoFocusTitle={shouldAutoFocusRootTitle}
								topic={topic}
								topicPath={topicPath}
							/>
							<TopicDocumentSection
								collapsedSections={collapsedSections}
								getScrollElement={getScrollElement}
								globalFilter={resolvedCardTypeFilter}
								onGlobalFilterChange={handleGlobalFilterChange}
								onOpenReviewCard={handleOpenReviewCard}
								onSectionFilterChange={handleSectionFilterChange}
								registerSectionRef={registerSectionRef}
								resolvedFilterByTopicId={sectionFilterOverrides}
								rootTopicId={topic.id}
								searchFilter={resolvedCardTypeFilter}
								section={rootSection}
								toggleSection={toggleSection}
								topicReviewCardsById={topicReviewCardsById}
							/>
						</div>
						<TopicDocumentOutline
							activeSectionId={activeSectionId}
							ancestorIdsById={ancestorIdsById}
							globalFilter={resolvedCardTypeFilter}
							nodeById={nodeById}
							onGlobalFilterChange={handleGlobalFilterChange}
							onSelectTopic={topicSectionId => {
								scrollToSection(topicSectionId)
							}}
							outlineRootNode={rootSection.topic}
						/>
					</div>
				</div>
			</div>
			<AlertDialog
				onOpenChange={setIsDeleteDialogOpen}
				open={isDeleteDialogOpen}
			>
				<AlertDialogContent size='sm'>
					<AlertDialogHeader>
						<AlertDialogMedia>
							<AlertTriangle className='h-5 w-5' />
						</AlertDialogMedia>
						<AlertDialogTitle>Delete topic?</AlertDialogTitle>
						<AlertDialogDescription>
							This will delete this topic, all subtopics, and all linked review
							cards and reviews. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							buttonClassName='w-full sm:w-auto'
							disabled={isDeletingTopic}
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							buttonClassName='w-full sm:w-auto'
							disabled={isDeletingTopic}
							onClick={() => {
								handleDeleteTopic().catch(() => {})
							}}
						>
							{isDeletingTopic ? 'Deleting...' : 'Delete topic'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}

export type { TopicDetailReviewCardFilter } from './shared'
