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
import { TopicDetailBodyPanel } from './TopicDetailBodyPanel'
import { TopicDetailBreadcrumb } from './TopicDetailBreadcrumb'
import { TopicDetailHeader } from './TopicDetailHeader'
import { TopicDetailReviewCardsTab } from './TopicDetailReviewCardsTab'
import { useTopicDetailPage } from './useTopicDetailPage'

type TopicDetailPageProps = {
	topicId: number
	cardTypeFilter?: TopicDetailReviewCardFilter | string
	onCardTypeFilterChange: (filter: TopicDetailReviewCardFilter) => void
}

export function TopicDetailPage({
	topicId,
	cardTypeFilter = 'all',
	onCardTypeFilterChange
}: TopicDetailPageProps) {
	const {
		body,
		flushBody,
		flushTitle,
		getScrollElement,
		guessBodyText,
		handleAddReviewCard,
		handleCopyGuessText,
		handleCopyRevealText,
		handleDeleteTopic,
		handleOpenReviewCard,
		hidesSecondary,
		isBodyEmpty,
		isCardsLoading,
		isCreatingReviewCard,
		isDeleteDialogOpen,
		isDeletingTopic,
		isRevealPanelCopied,
		isTopicLoading,
		onBodyChange,
		onCardTypeFilterChange: handleCardTypeFilterChange,
		onTitleChange,
		resolvedCardTypeFilter,
		revealPanelTab,
		reviewCards,
		scrollContainerRef,
		setBody,
		setGuessBodyText,
		setIsDeleteDialogOpen,
		setRevealPanelTab,
		title,
		titleTextareaRef,
		topic,
		topicError,
		topicPath
	} = useTopicDetailPage({
		topicId,
		cardTypeFilter,
		onCardTypeFilterChange
	})

	if (isTopicLoading) {
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

	if (!topic) {
		throw notFound()
	}

	return (
		<div className='flex h-full min-h-0 w-full'>
			<div className='flex min-h-0 min-w-0 flex-1 flex-col'>
				<TopicDetailHeader
					activeTopicId={topic.id}
					onOpenDeleteDialog={() => setIsDeleteDialogOpen(true)}
				/>
				<div className='flex-1 overflow-y-auto' ref={scrollContainerRef}>
					<div className='mx-auto w-full max-w-5xl px-6 py-5'>
						<div className='min-w-0 space-y-2'>
							<TopicDetailBreadcrumb
								onTitleBlur={flushTitle}
								onTitleChange={onTitleChange}
								title={title}
								titleTextareaRef={titleTextareaRef}
								topic={topic}
								topicPath={topicPath}
							/>
							<TopicDetailBodyPanel
								body={body}
								flushBody={flushBody}
								guessBodyText={guessBodyText}
								handleCopyGuessText={handleCopyGuessText}
								handleCopyRevealText={handleCopyRevealText}
								hidesSecondary={hidesSecondary}
								isBodyEmpty={isBodyEmpty}
								isRevealPanelCopied={isRevealPanelCopied}
								onBodyChange={onBodyChange}
								revealPanelTab={revealPanelTab}
								setBody={setBody}
								setGuessBodyText={setGuessBodyText}
								setRevealPanelTab={setRevealPanelTab}
							/>
							<TopicDetailReviewCardsTab
								getScrollElement={getScrollElement}
								isCreatingReviewCard={isCreatingReviewCard}
								isLoading={isCardsLoading}
								onAddReviewCard={type => {
									handleAddReviewCard(type).catch(() => {})
								}}
								onCardTypeFilterChange={handleCardTypeFilterChange}
								onOpenReviewCard={handleOpenReviewCard}
								resolvedCardTypeFilter={resolvedCardTypeFilter}
								reviewCards={reviewCards}
								topicTitle={topic.title}
							/>
						</div>
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
