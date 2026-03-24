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
import { RetireReviewCardDialog } from '~/features/review-cards/components/RetireReviewCardDialog'
import { SearchDialog } from '~/features/search/components/search-dialog/SearchDialog'
import { isHttpStatusError } from '~/utils/httpStatusError'
import { ReviewCardDetailHeader } from './ReviewCardDetailHeader'
import { ReviewCardDetailHomeTab } from './ReviewCardDetailHomeTab'
import { ReviewCardDetailNotesTab } from './ReviewCardDetailNotesTab'
import { ReviewCardDetailReviewsTab } from './ReviewCardDetailReviewsTab'
import type { ReviewCardDetailTab } from './shared'
import { useReviewCardDetailPage } from './useReviewCardDetailPage'

export function ReviewCardDetailPage({
	reviewCardId,
	activeTab,
	onActiveTabChange
}: {
	reviewCardId: number
	activeTab?: ReviewCardDetailTab | string
	onActiveTabChange?: (tab: ReviewCardDetailTab) => void
}) {
	const {
		answer,
		completedReviews,
		createReviewMutation,
		dueTodayCount,
		error,
		flushAnswer,
		flushNotes,
		flushPrompt,
		freshnessTierColor,
		freshnessTierInfo,
		guessAnswerText,
		handleAssignTopic,
		handleConvertType,
		handleCopyGuessText,
		handleCopyRevealText,
		handleCreateAndAssignTopic,
		handleDeleteReviewCard,
		handleNavigateToTopic,
		handleOpenTopicSearch,
		handleRatingSelect,
		handleRetiredToggle,
		handleSeeReviews,
		handleTabChange,
		handleUpdateReviewCardFields,
		hidesSecondary,
		isAnswerEmpty,
		isDeleteDialogOpen,
		isDeletingReviewCard,
		isLoading,
		isRevealPanelCopied,
		isRetireDialogOpen,
		isReviewsLoading,
		isTopicMenuOpen,
		isTopicMutationPending,
		isTopicSearchOpen,
		isTypeMutationPending,
		isUnreviewed,
		isUpdatingReviewCard,
		lastReviewed,
		latestCompletedReview,
		notes,
		onAnswerChange,
		onNotesChange,
		onPromptChange,
		openReviewDialog,
		overdueCount,
		overdueReviews,
		parentLabel,
		prompt,
		promptTextareaRef,
		resolvedActiveTab,
		resolvedReviews,
		revealPanelTab,
		reviewCard,
		reviewTriggerCounts,
		setAnswer,
		setGuessAnswerText,
		setIsDeleteDialogOpen,
		setIsRetireDialogOpen,
		setIsTopicMenuOpen,
		setIsTopicSearchOpen,
		setRevealPanelTab,
		setTopicSearchQuery,
		stabilityText,
		statusBadges,
		todayReviews,
		topicSearchQuery,
		uncompletedUnscheduledReviews,
		unscheduledCount,
		upcomingReviews
	} = useReviewCardDetailPage({
		activeTab,
		onActiveTabChange,
		reviewCardId
	})

	if (isLoading) {
		return (
			<div className='flex h-full min-h-0 w-full items-center justify-center'>
				<LoadingSpinner containerClassName='min-h-64' />
			</div>
		)
	}

	if (error) {
		if (isHttpStatusError(error) && error.status === 404) {
			throw notFound()
		}
		return (
			<LoadingOrError
				error={error instanceof Error ? error : new Error('Failed to load review card')}
			/>
		)
	}

	if (!reviewCard) {
		throw notFound()
	}

	return (
		<div className='flex h-full min-h-0 w-full'>
			<div className='flex min-h-0 min-w-0 flex-1 flex-col'>
				<ReviewCardDetailHeader
					activeTab={resolvedActiveTab}
					dueTodayCount={dueTodayCount}
					isTopicMenuOpen={isTopicMenuOpen}
					isTopicMutationPending={isTopicMutationPending}
					isUpdatingReviewCard={isUpdatingReviewCard}
					onCreateAndAssignTopic={handleCreateAndAssignTopic}
					onNavigateToTopic={handleNavigateToTopic}
					onOpenTopicSearch={handleOpenTopicSearch}
					onTabChange={handleTabChange}
					onTopicMenuOpenChange={setIsTopicMenuOpen}
					overdueCount={overdueCount}
					parentLabel={parentLabel}
					reviewCardTopicId={reviewCard.topic_id}
					unscheduledCount={unscheduledCount}
				/>
				{isTopicSearchOpen ? (
					<SearchDialog
						allowedTypes={['topic']}
						closeOnSelect={false}
						createLabel='Create topic'
						filterResult={result =>
							result.entity_type === 'topic' &&
							result.topic != null &&
							result.topic.id !== reviewCard.topic_id
						}
						initialFilter='topic'
						isCreating={isTopicMutationPending}
						onCreate={handleCreateAndAssignTopic}
						onOpenChange={setIsTopicSearchOpen}
						onSelectEntity={handleAssignTopic}
						open={isTopicSearchOpen}
						placeholder='Search topics to reassign this card...'
						query={topicSearchQuery}
						setQuery={setTopicSearchQuery}
						showAllOption={false}
						showNoTagOption={false}
						title='Search topic'
					/>
				) : null}

				<div className='flex min-h-0 flex-1 flex-col overflow-y-auto'>
					<div className='mx-auto flex min-h-full w-full max-w-5xl flex-1 flex-col px-6 py-5'>
						<div className='flex min-h-full min-w-0 flex-1 flex-col'>
							{resolvedActiveTab === 'reviews' ? (
								<ReviewCardDetailReviewsTab
									completedReviews={completedReviews}
									isCreatingReview={createReviewMutation.isPending}
									isLoading={isReviewsLoading}
									onOpenReviewDialog={openReviewDialog}
									onSelectRating={handleRatingSelect}
									overdueReviews={overdueReviews}
									todayReviews={todayReviews}
									uncompletedUnscheduledReviews={uncompletedUnscheduledReviews}
									upcomingReviews={upcomingReviews}
								/>
							) : resolvedActiveTab === 'notes' ? (
								<ReviewCardDetailNotesTab
									flushNotes={flushNotes}
									notes={notes}
									onNotesChange={onNotesChange}
								/>
							) : (
								<ReviewCardDetailHomeTab
									answer={answer}
									flushAnswer={flushAnswer}
									flushPrompt={flushPrompt}
									freshnessTierColor={freshnessTierColor}
									freshnessTierInfo={freshnessTierInfo}
									guessAnswerText={guessAnswerText}
									handleConvertType={handleConvertType}
									handleCopyGuessText={handleCopyGuessText}
									handleCopyRevealText={handleCopyRevealText}
									handleSeeReviews={handleSeeReviews}
									handleUpdateReviewCardFields={handleUpdateReviewCardFields}
									hidesSecondary={hidesSecondary}
									isAnswerEmpty={isAnswerEmpty}
									isRevealPanelCopied={isRevealPanelCopied}
									isRetireDisabled={isUpdatingReviewCard}
									isTypeMutationPending={isTypeMutationPending}
									isUpdatingReviewCard={isUpdatingReviewCard}
									isUnreviewed={isUnreviewed}
									lastReviewed={lastReviewed}
									latestCompletedReview={latestCompletedReview}
									onAnswerChange={onAnswerChange}
									onOpenDeleteDialog={() => setIsDeleteDialogOpen(true)}
									onOpenReviewDialog={openReviewDialog}
									onPromptChange={onPromptChange}
									onRetireToggle={handleRetiredToggle}
									prompt={prompt}
									promptTextareaRef={promptTextareaRef}
									resolvedReviews={resolvedReviews}
									revealPanelTab={revealPanelTab}
									reviewCard={reviewCard}
									reviewTriggerCounts={reviewTriggerCounts}
									setAnswer={setAnswer}
									setGuessAnswerText={setGuessAnswerText}
									setRevealPanelTab={setRevealPanelTab}
									stabilityText={stabilityText}
									statusBadges={statusBadges}
								/>
							)}
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
						<AlertDialogTitle>Delete review card?</AlertDialogTitle>
						<AlertDialogDescription>
							This will delete this review card and all linked reviews. This
							action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							buttonClassName='w-full sm:w-auto'
							disabled={isDeletingReviewCard}
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							buttonClassName='w-full sm:w-auto'
							disabled={isDeletingReviewCard}
							onClick={() => {
								handleDeleteReviewCard().catch(() => {})
							}}
						>
							{isDeletingReviewCard ? 'Deleting...' : 'Delete review card'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<RetireReviewCardDialog
				isPending={isUpdatingReviewCard}
				onConfirm={() => {
					handleUpdateReviewCardFields({
						retired: !reviewCard.retired
					})
					setIsRetireDialogOpen(false)
				}}
				onOpenChange={setIsRetireDialogOpen}
				onSeeReviews={handleSeeReviews}
				open={isRetireDialogOpen}
			/>
		</div>
	)
}

export type { ReviewCardDetailTab } from './shared'
