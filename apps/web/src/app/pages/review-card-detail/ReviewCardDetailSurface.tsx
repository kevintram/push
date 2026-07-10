import { notFound } from '@tanstack/react-router'
import { AlertTriangle, ExternalLink } from 'lucide-react'

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
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { ScrollArea } from '~/components/ui/scroll-area'
import { cn } from '~/lib/utils'
import { RetireReviewCardDialog } from '~/modules/review-cards/components/RetireReviewCardDialog'
import { SearchDialog } from '~/modules/search/components/search-dialog/SearchDialog'
import { isHttpStatusError } from '~/utils/httpStatusError'

import { ReviewCardDetailHeader } from './ReviewCardDetailHeader'
import { ReviewCardDetailHomeTab } from './ReviewCardDetailHomeTab'
import { ReviewCardDetailReviewsTab } from './ReviewCardDetailReviewsTab'
import { type ReviewCardDetailTab } from './shared'
import { useReviewCardDetailPage } from './useReviewCardDetailPage'

export type ReviewCardDetailSurfaceMode = 'fullPage' | 'contained'

export function ReviewCardDetailSurface({
	reviewCardId,
	activeTab,
	mode = 'fullPage',
	onActiveTabChange,
	onCompletedReviewCreated,
}: {
	reviewCardId: number
	activeTab?: ReviewCardDetailTab | string
	mode?: ReviewCardDetailSurfaceMode
	onActiveTabChange?: (tab: ReviewCardDetailTab) => void
	onCompletedReviewCreated?: () => void
}) {
	const {
		secondaryText,
		completedReviews,
		createReviewMutation,
		dueTodayCount,
		error,
		flushPrimaryText,
		flushNotes,
		flushSecondaryText,
		freshnessTierColor,
		freshnessTierInfo,
		guessSecondaryText,
		handleAssignTopic,
		handleConvertType,
		handleCopyGuessText,
		handleCopyRevealText,
		handleCreateAndAssignTopic,
		handleDeleteReviewCard,
		handleNavigateToTopic,
		handleOpenFullPage,
		handleOpenTopicSearch,
		handleRatingSelect,
		handleRetiredToggle,
		handleSeeReviews,
		handleTabChange,
		handleUpdateReviewCardFields,
		hidesSecondary,
		isDeleteDialogOpen,
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
		onPrimaryTextChange,
		onNotesChange,
		onSecondaryTextChange,
		onCompletedReviewCreated: handleCompletedReviewCreated,
		openReviewDialog,
		overdueCount,
		overdueReviews,
		parentLabel,
		primaryText,
		primaryTextTextareaRef,
		resolvedActiveTab,
		resolvedReviews,
		revealPanelTab,
		reviewCard,
		reviewTriggerCounts,
		pendingCount,
		setSecondaryText,
		setNotes,
		setGuessSecondaryText,
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
		upcomingReviews,
	} = useReviewCardDetailPage({
		activeTab,
		onActiveTabChange,
		onCompletedReviewCreated,
		reviewCardId,
	})

	const isContained = mode === 'contained'

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
				error={
					error instanceof Error
						? error
						: new Error('Failed to load review card')
				}
			/>
		)
	}

	if (!reviewCard) {
		throw notFound()
	}

	return (
		<div
			className={cn(
				'flex h-full min-h-0 w-full',
				isContained &&
					'overflow-hidden rounded-lg border bg-background shadow-sm',
			)}
		>
			<div className='flex min-h-0 min-w-0 flex-1 flex-col'>
				<ReviewCardDetailHeader
					activeTab={resolvedActiveTab}
					afterActions={
						isContained ? (
							<Button
								aria-label='Open review card'
								className='size-5 rounded-full [&_svg]:size-3'
								onClick={handleOpenFullPage}
								size='icon-xs'
								title='Open'
								type='button'
							>
								<ExternalLink className='size-3' />
							</Button>
						) : null
					}
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
					pendingCount={pendingCount}
				/>
				{isTopicSearchOpen ? (
					<SearchDialog
						allowedTypes={['topic']}
						closeOnSelect={false}
						createLabel='Create topic'
						filterResult={result =>
							result.entityType === 'topic' &&
							result.topic != null &&
							result.topic.id !== reviewCard.topicId
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

				<ScrollArea
					className='min-h-0 flex-1'
					scrollbarClassName='p-px data-[orientation=horizontal]:h-2.5 data-[orientation=vertical]:w-2.5'
				>
					<div
						className={cn(
							'mx-auto flex min-h-full w-full flex-1 flex-col',
							isContained
								? 'max-w-4xl px-4 py-4'
								: 'max-w-5xl px-6 py-5',
						)}
					>
						<div className='flex min-h-full min-w-0 flex-1 flex-col'>
							{resolvedActiveTab === 'reviews' ? (
								<ReviewCardDetailReviewsTab
									completedReviews={completedReviews}
									isCreatingReview={
										createReviewMutation.isPending
									}
									isLoading={isReviewsLoading}
									onOpenReviewDialog={openReviewDialog}
									onSelectRating={handleRatingSelect}
									overdueReviews={overdueReviews}
									todayReviews={todayReviews}
									uncompletedUnscheduledReviews={
										uncompletedUnscheduledReviews
									}
									upcomingReviews={upcomingReviews}
								/>
							) : (
								<ReviewCardDetailHomeTab
									flushNotes={flushNotes}
									flushPrimaryText={flushPrimaryText}
									flushSecondaryText={flushSecondaryText}
									freshnessTierColor={freshnessTierColor}
									freshnessTierInfo={freshnessTierInfo}
									guessSecondaryText={guessSecondaryText}
									handleConvertType={handleConvertType}
									handleCopyGuessText={handleCopyGuessText}
									handleCopyRevealText={handleCopyRevealText}
									handleSeeReviews={handleSeeReviews}
									handleUpdateReviewCardFields={
										handleUpdateReviewCardFields
									}
									hidesSecondary={hidesSecondary}
									isRetireDisabled={isUpdatingReviewCard}
									isRevealPanelCopied={isRevealPanelCopied}
									isTypeMutationPending={
										isTypeMutationPending
									}
									isUnreviewed={isUnreviewed}
									isUpdatingReviewCard={isUpdatingReviewCard}
									lastReviewed={lastReviewed}
									latestCompletedReview={
										latestCompletedReview
									}
									notes={notes}
									onCompletedReviewCreated={
										handleCompletedReviewCreated
									}
									onNotesChange={onNotesChange}
									onOpenDeleteDialog={() =>
										setIsDeleteDialogOpen(true)
									}
									onOpenReviewDialog={openReviewDialog}
									onPrimaryTextChange={onPrimaryTextChange}
									onRetireToggle={handleRetiredToggle}
									onSecondaryTextChange={
										onSecondaryTextChange
									}
									primaryText={primaryText}
									primaryTextTextareaRef={
										primaryTextTextareaRef
									}
									resolvedReviews={resolvedReviews}
									revealPanelTab={revealPanelTab}
									reviewCard={reviewCard}
									reviewTriggerCounts={reviewTriggerCounts}
									secondaryText={secondaryText}
									setGuessSecondaryText={
										setGuessSecondaryText
									}
									setNotes={setNotes}
									setRevealPanelTab={setRevealPanelTab}
									setSecondaryText={setSecondaryText}
									stabilityText={stabilityText}
									statusBadges={statusBadges}
								/>
							)}
						</div>
					</div>
				</ScrollArea>
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
							This will delete this review card and all linked
							reviews.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel buttonClassName='w-full sm:w-auto'>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							buttonClassName='w-full sm:w-auto'
							onClick={handleDeleteReviewCard}
						>
							Delete review card
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<RetireReviewCardDialog
				isPending={isUpdatingReviewCard}
				onConfirm={() => {
					handleUpdateReviewCardFields({
						retired: !reviewCard.retired,
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
