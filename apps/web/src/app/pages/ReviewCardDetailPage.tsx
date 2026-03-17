import { notFound, useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import {
	AlertTriangle,
	Anvil,
	ArrowLeftRight,
	Brain,
	ChevronDown,
	Flag,
	Loader2,
	MoreHorizontal,
	Plus,
	Search,
	Sparkles,
	Sunset,
	Trash2,
	User2
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { LoadingOrError } from '~/components/LoadingOrError'
import { RevealPanel } from '~/components/RevealPanel'
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
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { DetailNavBar, type DetailNavTab } from '~/components/ui/detail-nav-bar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { Textarea } from '~/components/ui/textarea'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/tooltip'
import { useDeleteReviewCard } from '~/features/review-cards/api/deleteReviewCard'
import { useReviewCard } from '~/features/review-cards/api/getReviewCard'
import { useUpdateReviewCard } from '~/features/review-cards/api/updateReviewCard'
import { RetireReviewCardDialog } from '~/features/review-cards/components/RetireReviewCardDialog'
import {
	type ReviewCardBadge,
	toReviewCardBadge
} from '~/features/review-cards/components/ReviewCard'
import { hasScheduledDueReviews } from '~/features/review-cards/utils/hasScheduledDueReviews'
import { orderReviewCardStatusBadges } from '~/features/review-cards/utils/orderReviewCardStatusBadges'
import { useCreateReview } from '~/features/reviews/api/createReview'
import { useReviewsByReviewCard } from '~/features/reviews/api/getReviews'
import { RatingDropdown } from '~/features/reviews/components/RatingDropdown'
import { ReviewItem } from '~/features/reviews/components/ReviewItem'
import { ReviewListHeader } from '~/features/reviews/components/ReviewListHeader'
import type { ReviewRatingState } from '~/features/reviews/components/ReviewRatingCheckbox'
import { useDetailReviewCounts } from '~/features/reviews/hooks/useDetailReviewCounts'
import { useReviewDialog } from '~/features/reviews/hooks/useReviewDialog'
import type { ReviewListItem } from '~/features/reviews/types/review.types'
import {
	getReviewCreatedToastActionLabel,
	getReviewCreatedToastDescription
} from '~/features/reviews/utils/reviewToastDescription'
import { SearchDialog } from '~/features/search/components/SearchDialog'
import type { SearchResultItem } from '~/features/search/types/search.types'
import { useCreateTopic } from '~/features/topics/api/createTopic'
import { useTopic } from '~/features/topics/api/getTopic'
import { TopicNavigatorSheet } from '~/features/topics/components/TopicNavigator'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useLearnableMetrics } from '~/hooks/useLearnableMetrics'
import { useRevealPanel } from '~/hooks/useRevealPanel'
import { useReviewMode } from '~/stores/ReviewModeContext'
import { localDateString } from '~/utils/date'
import {
	formatAbsoluteDate,
	formatRelativeDate
} from '~/utils/formatRelativeDate'
import { getRatingIcon } from '~/utils/getRatingIcon'
import { isHttpStatusError } from '~/utils/httpStatusError'

const EMPTY_BADGE_CLASSNAME =
	'h-5 rounded-sm border-transparent bg-amber-100 text-amber-900 text-xs shadow-sm dark:bg-amber-950 dark:text-amber-200'
const FLAGGED_ICON_CLASSNAME =
	'h-4 w-4 fill-current text-sky-500 dark:text-sky-300'

export type ReviewCardDetailTab = 'home' | 'notes' | 'reviews'

function isReviewCardDetailTab(value: string): value is ReviewCardDetailTab {
	return value === 'home' || value === 'notes' || value === 'reviews'
}

function toFreshnessTier(
	value: string | null
): 'Fresh' | 'Fine' | 'Hazy' | 'Forgotten' | null {
	if (
		value === 'Fresh' ||
		value === 'Fine' ||
		value === 'Hazy' ||
		value === 'Forgotten'
	) {
		return value
	}
	return null
}

function splitReviews(reviews: Array<ReviewListItem>) {
	const today = localDateString()
	const uncompletedUnscheduled: Array<ReviewListItem> = []
	const overdue: Array<ReviewListItem> = []
	const todayReviews: Array<ReviewListItem> = []
	const upcoming: Array<ReviewListItem> = []
	const completed: Array<ReviewListItem> = []

	for (const review of reviews) {
		if (review.completed_at) {
			completed.push(review)
			continue
		}

		if (review.scheduled_at || review.effective_date) {
			const date = review.effective_date ?? review.scheduled_at
			if (date && date < today) {
				overdue.push(review)
			} else if (date && date === today) {
				todayReviews.push(review)
			} else {
				upcoming.push(review)
			}
			continue
		}

		uncompletedUnscheduled.push(review)
	}

	const sortByEffectiveDateAsc = (a: ReviewListItem, b: ReviewListItem) =>
		new Date(a.effective_date ?? 0).getTime() -
		new Date(b.effective_date ?? 0).getTime()

	overdue.sort(sortByEffectiveDateAsc)
	todayReviews.sort(sortByEffectiveDateAsc)
	upcoming.sort(sortByEffectiveDateAsc)
	uncompletedUnscheduled.sort((a, b) => {
		return new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime()
	})
	completed.sort((a, b) => {
		return (
			new Date(b.completed_at ?? b.effective_date ?? 0).getTime() -
			new Date(a.completed_at ?? a.effective_date ?? 0).getTime()
		)
	})

	return {
		uncompletedUnscheduledReviews: uncompletedUnscheduled,
		overdueReviews: overdue,
		todayReviews,
		upcomingReviews: upcoming,
		completedReviews: completed
	}
}

export function ReviewCardDetailPage({
	reviewCardId,
	activeTab,
	onActiveTabChange
}: {
	reviewCardId: number
	activeTab?: ReviewCardDetailTab | string
	onActiveTabChange?: (tab: ReviewCardDetailTab) => void
}) {
	const navigate = useNavigate()
	const [fallbackActiveTab, setFallbackActiveTab] =
		useState<ReviewCardDetailTab>('home')
	const resolvedActiveTab: ReviewCardDetailTab =
		activeTab != null && isReviewCardDetailTab(activeTab)
			? activeTab
			: fallbackActiveTab

	const {
		data: reviewCard,
		isLoading,
		error: reviewCardError
	} = useReviewCard(Number.isNaN(reviewCardId) ? null : reviewCardId)
	const { data: topic } = useTopic(reviewCard?.topic_id ?? null)
	const {
		mutateAsync: updateReviewCardAsync,
		isPending: isUpdatingReviewCard
	} = useUpdateReviewCard()
	const { mutateAsync: createTopicAsync } = useCreateTopic()
	const {
		mutateAsync: deleteReviewCardAsync,
		isPending: isDeletingReviewCard
	} = useDeleteReviewCard()
	const createReviewMutation = useCreateReview()
	const { openReviewDialog } = useReviewDialog()

	const { unscheduledCount, overdueCount, dueTodayCount } =
		useDetailReviewCounts(
			reviewCard ? { reviewCardId: reviewCard.id } : undefined
		)
	const { data: reviews = [], isLoading: isReviewsLoading } =
		useReviewsByReviewCard(reviewCard?.id)

	const {
		uncompletedUnscheduledReviews,
		overdueReviews,
		todayReviews,
		upcomingReviews,
		completedReviews
	} = useMemo(() => splitReviews(reviews), [reviews])

	const metrics = useLearnableMetrics(
		reviewCard
			? {
					retrievability: reviewCard.retrievability,
					freshness_tier: toFreshnessTier(reviewCard.freshness_tier),
					days_until_next_tier: reviewCard.days_until_next_tier,
					stability: reviewCard.stability,
					last_reviewed_at: reviewCard.last_reviewed_at,
					inherited_stability: null
				}
			: null
	)
	const { freshnessTierInfo, freshnessTierColor, isUnreviewed, stabilityText } =
		metrics

	const latestCompletedReview = useMemo(() => {
		let latest: (typeof reviews)[number] | null = null
		for (const review of reviews) {
			if (!review.completed_at) continue
			if (!latest) {
				latest = review
				continue
			}
			if (
				new Date(review.completed_at).getTime() >
				new Date(latest.completed_at ?? 0).getTime()
			) {
				latest = review
			}
		}
		return latest
	}, [reviews])

	const lastReviewed = useMemo(
		() =>
			formatRelativeDate(
				latestCompletedReview?.completed_at ??
					reviewCard?.last_reviewed_at ??
					null,
				{
					includeFuture: false,
					nullLabel: 'never'
				}
			),
		[latestCompletedReview?.completed_at, reviewCard?.last_reviewed_at]
	)

	const statusBadges = useMemo<Array<ReviewCardBadge>>(
		() =>
			orderReviewCardStatusBadges(reviewCard?.status_badges ?? []).map(
				apiBadge =>
					toReviewCardBadge(apiBadge, {
						onOpenReviewDialog: openReviewDialog
					})
			),
		[reviewCard?.status_badges, openReviewDialog]
	)

	const { hidesSecondary } = useReviewMode()
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [isRetireDialogOpen, setIsRetireDialogOpen] = useState(false)
	const [isTopicMenuOpen, setIsTopicMenuOpen] = useState(false)
	const [isTopicSearchOpen, setIsTopicSearchOpen] = useState(false)
	const [topicSearchQuery, setTopicSearchQuery] = useState('')
	const [isTopicMutationPending, setIsTopicMutationPending] = useState(false)
	const [isTypeMutationPending, setIsTypeMutationPending] = useState(false)

	useEffect(() => {
		if (!reviewCard) return
		setIsRetireDialogOpen(false)
	}, [reviewCard])

	const parentLabel = useMemo(() => {
		if (topic?.title?.trim()) return topic.title
		if (reviewCard?.topic_id != null) return `Topic #${reviewCard.topic_id}`
		return 'None'
	}, [topic?.title, reviewCard?.topic_id])

	const handleUpdateReviewCardFields = useCallback(
		(fields: {
			prompt?: string
			answer?: string
			notes?: string
			retired?: boolean
			flagged?: boolean
		}) => {
			if (!reviewCard) return
			Promise.resolve(
				updateReviewCardAsync({ id: reviewCard.id, ...fields })
			).catch(() => {
				toast.error('Failed to update review card')
			})
		},
		[reviewCard, updateReviewCardAsync]
	)

	const saveReviewCardPrompt = useCallback(
		(newPrompt: string) => {
			if (!reviewCard || newPrompt === reviewCard.prompt) return
			handleUpdateReviewCardFields({ prompt: newPrompt })
		},
		[handleUpdateReviewCardFields, reviewCard]
	)

	const saveReviewCardAnswer = useCallback(
		(newAnswer: string) => {
			if (!reviewCard || newAnswer === reviewCard.answer) return
			handleUpdateReviewCardFields({ answer: newAnswer })
		},
		[handleUpdateReviewCardFields, reviewCard]
	)

	const saveReviewCardNotes = useCallback(
		(newNotes: string) => {
			if (!reviewCard || newNotes === reviewCard.notes) return
			handleUpdateReviewCardFields({ notes: newNotes })
		},
		[handleUpdateReviewCardFields, reviewCard]
	)

	const {
		value: prompt,
		onChange: onPromptChange,
		flush: flushPrompt
	} = useAutoSave({
		initialValue: reviewCard?.prompt ?? '',
		onSave: saveReviewCardPrompt,
		key: `review-card-prompt-${reviewCard?.id ?? 'new'}`
	})

	const {
		value: answer,
		onChange: onAnswerChange,
		setValue: setAnswer,
		flush: flushAnswer
	} = useAutoSave({
		initialValue: reviewCard?.answer ?? '',
		onSave: saveReviewCardAnswer,
		key: `review-card-answer-${reviewCard?.id ?? 'new'}`
	})

	const {
		value: notes,
		onChange: onNotesChange,
		flush: flushNotes
	} = useAutoSave({
		initialValue: reviewCard?.notes ?? '',
		onSave: saveReviewCardNotes,
		key: `review-card-notes-${reviewCard?.id ?? 'new'}`
	})

	const {
		revealPanelTab,
		setRevealPanelTab,
		guessText: guessAnswerText,
		setGuessText: setGuessAnswerText,
		isCopied: isRevealPanelCopied,
		handleCopyGuessText,
		handleCopyRevealText
	} = useRevealPanel({
		revealText: answer,
		entityId: reviewCard?.id ?? null,
		hidesSecondary,
		defaultTab: hidesSecondary ? null : 'reveal'
	})

	const handleRetiredToggle = useCallback(() => {
		if (!reviewCard) return
		if (!reviewCard.retired && hasScheduledDueReviews(reviewCard)) {
			setIsRetireDialogOpen(true)
			return
		}
		handleUpdateReviewCardFields({
			retired: !reviewCard.retired
		})
	}, [handleUpdateReviewCardFields, reviewCard])

	const handleSeeReviews = useCallback(() => {
		if (!reviewCard) return
		setIsRetireDialogOpen(false)
		if (onActiveTabChange) {
			onActiveTabChange('reviews')
			return
		}
		navigate({
			to: '/review-cards/$reviewCardId',
			params: { reviewCardId: reviewCard.id.toString() },
			search: { tab: 'reviews' }
		})
	}, [navigate, onActiveTabChange, reviewCard])

	const handleRatingSelect = useCallback(
		async (ratingState: ReviewRatingState) => {
			if (!reviewCard || createReviewMutation.isPending) return
			try {
				const review = await createReviewMutation.mutateAsync({
					review_card_id: reviewCard.id,
					rating: ratingState === 'uncompleted' ? null : ratingState,
					description: '',
					scheduled_at: null,
					completed_at: ratingState === 'uncompleted' ? null : localDateString()
				})

				toast('Review created', {
					description: getReviewCreatedToastDescription(review),
					action: {
						label: getReviewCreatedToastActionLabel(review),
						onClick: () => openReviewDialog(review.id)
					}
				})
			} catch {
				toast.error('Failed to create review')
			}
		},
		[reviewCard, createReviewMutation, openReviewDialog]
	)
	const handleDeleteReviewCard = useCallback(async () => {
		if (!reviewCard || isDeletingReviewCard) return
		try {
			await deleteReviewCardAsync(reviewCard.id)
			setIsDeleteDialogOpen(false)
			toast.success('Review card deleted')
			if (reviewCard.topic_id != null) {
				navigate({
					to: '/topics/$topicId',
					params: { topicId: reviewCard.topic_id.toString() }
				})
				return
			}
			navigate({ to: '/topics' })
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete review card'
			)
		}
	}, [deleteReviewCardAsync, isDeletingReviewCard, navigate, reviewCard])
	const handleConvertType = useCallback(async () => {
		if (!reviewCard || isTypeMutationPending) return
		const newType = reviewCard.type === 'practice' ? 'flashcard' : 'practice'
		setIsTypeMutationPending(true)
		try {
			await updateReviewCardAsync({ id: reviewCard.id, type: newType })
			toast.success(
				`Converted to ${newType === 'practice' ? 'Practice' : 'Flashcard'}`
			)
		} catch {
			toast.error('Failed to convert card')
		} finally {
			setIsTypeMutationPending(false)
		}
	}, [reviewCard, isTypeMutationPending, updateReviewCardAsync])
	const handleOpenTopicSearch = useCallback(() => {
		if (isTopicMutationPending || isUpdatingReviewCard) return
		setTopicSearchQuery('')
		setIsTopicSearchOpen(true)
	}, [isTopicMutationPending, isUpdatingReviewCard])
	const handleAssignTopic = useCallback(
		async (entity: SearchResultItem) => {
			if (
				!reviewCard ||
				entity.entity_type !== 'topic' ||
				!entity.topic ||
				isTopicMutationPending
			) {
				return
			}

			if (entity.topic.id === reviewCard.topic_id) {
				setIsTopicSearchOpen(false)
				return
			}

			setIsTopicMutationPending(true)
			try {
				await updateReviewCardAsync({
					id: reviewCard.id,
					topic_id: entity.topic.id
				})
				toast.success('Topic changed')
				setIsTopicSearchOpen(false)
			} catch {
				toast.error('Failed to change topic')
			} finally {
				setIsTopicMutationPending(false)
			}
		},
		[isTopicMutationPending, reviewCard, updateReviewCardAsync]
	)
	const handleCreateAndAssignTopic = useCallback(async () => {
		if (!reviewCard || isTopicMutationPending) return

		setIsTopicMutationPending(true)
		try {
			const created = await createTopicAsync({
				title: '',
				body: '',
				parent_id: null
			})

			try {
				await updateReviewCardAsync({
					id: reviewCard.id,
					topic_id: created.id
				})
				toast.success('Topic changed')
				setIsTopicSearchOpen(false)
			} catch {
				toast.error('Topic created but failed to assign')
			}
		} catch {
			toast.error('Failed to create topic')
		} finally {
			setIsTopicMutationPending(false)
		}
	}, [
		createTopicAsync,
		isTopicMutationPending,
		reviewCard,
		updateReviewCardAsync
	])

	if (isLoading) {
		return (
			<div className='flex h-full min-h-0 w-full items-center justify-center'>
				<LoadingSpinner containerClassName='min-h-64' />
			</div>
		)
	}

	if (reviewCardError) {
		if (isHttpStatusError(reviewCardError) && reviewCardError.status === 404) {
			throw notFound()
		}
		return (
			<LoadingOrError
				error={
					reviewCardError instanceof Error
						? reviewCardError
						: new Error('Failed to load review card')
				}
			/>
		)
	}

	if (!reviewCard) {
		throw notFound()
	}

	const isAnswerEmpty = answer.trim().length === 0

	return (
		<div className='flex h-full min-h-0 w-full'>
			<div className='flex min-h-0 min-w-0 flex-1 flex-col'>
				<DetailNavBar
					activeTab={resolvedActiveTab}
					afterActions={
						<TopicNavigatorSheet activeTopicId={reviewCard.topic_id} />
					}
					dueTodayCount={dueTodayCount}
					leftContent={
						<div className='flex min-w-0 items-center gap-2'>
							<div className='flex items-center gap-1 text-muted-foreground text-xs'>
								<User2 className='h-3 w-3' />
								<span>Topic</span>
							</div>
							<Badge
								className={`group/topic h-6 rounded-full px-1 text-xs ${
									isTopicMenuOpen
										? 'bg-muted text-muted-foreground dark:bg-muted/50'
										: ''
								}`}
								variant='ghost'
							>
								<Button
									className={`h-5 cursor-pointer rounded-full px-0 font-medium text-xs leading-none ${
										isTopicMenuOpen ? 'text-muted-foreground' : ''
									}`}
									onClick={() =>
										navigate({
											to: '/topics/$topicId',
											params: { topicId: reviewCard.topic_id.toString() }
										})
									}
									size='xs'
									type='button'
									variant='ghost'
								>
									{parentLabel}
								</Button>
								<DropdownMenu onOpenChange={setIsTopicMenuOpen}>
									<DropdownMenuTrigger
										disabled={isTopicMutationPending || isUpdatingReviewCard}
										render={
											<Button
												aria-label='Change topic'
												className={`inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full p-0 transition-opacity ${
													isTopicMenuOpen
														? 'pointer-events-auto opacity-100'
														: 'pointer-events-none opacity-0 focus-visible:pointer-events-auto focus-visible:opacity-100 group-hover/topic:pointer-events-auto group-hover/topic:opacity-100 group-active/topic:pointer-events-auto group-active/topic:opacity-100'
												}`}
												size='icon-xs'
												type='button'
												variant='ghost'
											/>
										}
									>
										<ArrowLeftRight className='h-3 w-3' />
									</DropdownMenuTrigger>
									<DropdownMenuContent align='end' side='bottom' sideOffset={4}>
										<div className='px-2 py-1.5 font-medium text-muted-foreground text-xs'>
											Swap topic
										</div>
										<DropdownMenuItem onClick={handleOpenTopicSearch}>
											<Search className='mr-2 h-4 w-4' />
											Search
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => {
												handleCreateAndAssignTopic().catch(() => {})
											}}
										>
											<Plus className='mr-2 h-4 w-4' />
											Create
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</Badge>
						</div>
					}
					onTabChange={(tab: DetailNavTab) => {
						setFallbackActiveTab(tab)
						onActiveTabChange?.(tab)
					}}
					overdueCount={overdueCount}
					showNotesTab={true}
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
							{(() => {
								if (resolvedActiveTab === 'reviews') {
									return isReviewsLoading ? (
										<LoadingSpinner containerClassName='min-h-40 py-2' />
									) : (
										<div className='space-y-6 py-2'>
											<div className='flex items-center justify-end'>
												<RatingDropdown
													align='end'
													onSelect={handleRatingSelect}
													trigger={
														<Button
															className='rounded-full'
															disabled={createReviewMutation.isPending}
															size='sm'
															variant='default'
														>
															{createReviewMutation.isPending ? (
																<Loader2 className='h-4 w-4 animate-spin' />
															) : (
																<Plus className='h-4 w-4' />
															)}
															Review
															<ChevronDown className='h-4 w-4' />
														</Button>
													}
												/>
											</div>
											{uncompletedUnscheduledReviews.length === 0 &&
											overdueReviews.length === 0 &&
											todayReviews.length === 0 &&
											upcomingReviews.length === 0 &&
											completedReviews.length === 0 ? null : (
												<div className='flex flex-col gap-10'>
													{uncompletedUnscheduledReviews.length > 0 && (
														<div>
															<div className='@container/review-list'>
																<ReviewListHeader showCardColumn={false} />
																{uncompletedUnscheduledReviews.map(entry => (
																	<ReviewItem
																		entry={entry}
																		key={entry.id}
																		onReviewClick={openReviewDialog}
																		showCardColumn={false}
																		variant='default'
																	/>
																))}
															</div>
														</div>
													)}
													{overdueReviews.length > 0 && (
														<div>
															<h2 className='mb-3 font-bold text-2xl text-red-600 dark:text-red-400'>
																Overdue
															</h2>
															<div className='@container/review-list'>
																<ReviewListHeader showCardColumn={false} />
																{overdueReviews.map(entry => (
																	<ReviewItem
																		entry={entry}
																		key={entry.id}
																		onReviewClick={openReviewDialog}
																		showCardColumn={false}
																		variant='default'
																	/>
																))}
															</div>
														</div>
													)}
													{todayReviews.length > 0 && (
														<div>
															<h2 className='mb-3 font-bold text-2xl text-blue-600 dark:text-blue-400'>
																Today
															</h2>
															<div className='@container/review-list'>
																<ReviewListHeader showCardColumn={false} />
																{todayReviews.map(entry => (
																	<ReviewItem
																		entry={entry}
																		key={entry.id}
																		onReviewClick={openReviewDialog}
																		showCardColumn={false}
																		variant='default'
																	/>
																))}
															</div>
														</div>
													)}
													{upcomingReviews.length > 0 && (
														<div>
															<h2 className='mb-3 font-bold text-2xl'>
																Upcoming
															</h2>
															<div className='@container/review-list'>
																<ReviewListHeader showCardColumn={false} />
																{upcomingReviews.map(entry => (
																	<ReviewItem
																		entry={entry}
																		key={entry.id}
																		onReviewClick={openReviewDialog}
																		showCardColumn={false}
																		variant='default'
																	/>
																))}
															</div>
														</div>
													)}
													{completedReviews.length > 0 && (
														<div>
															<h2 className='mb-3 font-bold text-2xl'>
																Completed
															</h2>
															<div className='@container/review-list'>
																<ReviewListHeader showCardColumn={false} />
																{completedReviews.map(entry => (
																	<ReviewItem
																		entry={entry}
																		key={entry.id}
																		onReviewClick={openReviewDialog}
																		showCardColumn={false}
																		variant='default'
																	/>
																))}
															</div>
														</div>
													)}
												</div>
											)}
										</div>
									)
								}

								if (resolvedActiveTab === 'notes') {
									return (
										<div className='flex min-h-0 flex-1 flex-col gap-2 py-2'>
											<div className='flex items-center justify-between gap-2'>
												<h2 className='font-semibold text-lg'>Notes</h2>
											</div>
											<Textarea
												className='!bg-transparent field-sizing-fixed m-0 h-full min-h-[2lh] flex-1 resize-none overflow-hidden break-words rounded-none border-none p-0 text-base leading-relaxed shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
												onBlur={flushNotes}
												onChange={onNotesChange}
												placeholder='Add notes...'
												spellCheck={false}
												value={notes}
											/>
										</div>
									)
								}

								return (
									<div className='flex min-h-0 flex-1 flex-col gap-2'>
										<div className='flex flex-wrap items-center justify-between gap-2'>
											<div className='flex min-w-0 flex-wrap items-center gap-2'>
												<Badge
													className='group/type h-6 rounded-full px-1 text-xs'
													variant='ghost'
												>
													<span className='px-1 font-medium text-xs leading-none'>
														{reviewCard.type === 'practice'
															? 'Practice'
															: 'Flashcard'}
													</span>
													<Tooltip>
														<TooltipTrigger
															render={
																<Button
																	aria-label='Convert type'
																	className='pointer-events-none inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full p-0 opacity-0 transition-opacity focus-visible:pointer-events-auto focus-visible:opacity-100 group-hover/type:pointer-events-auto group-hover/type:opacity-100 group-active/type:pointer-events-auto group-active/type:opacity-100'
																	disabled={
																		isTypeMutationPending ||
																		isUpdatingReviewCard
																	}
																	onClick={() => {
																		void handleConvertType()
																	}}
																	size='icon-xs'
																	type='button'
																	variant='ghost'
																/>
															}
														>
															<ArrowLeftRight className='h-3 w-3' />
														</TooltipTrigger>
														<TooltipContent>
															{reviewCard.type === 'practice'
																? 'Convert to Flashcard'
																: 'Convert to Practice'}
														</TooltipContent>
													</Tooltip>
												</Badge>
											</div>
											<div className='flex flex-wrap items-center justify-end gap-1.5'>
												{statusBadges.map((badge, index) => (
													<Tooltip key={`${badge.label}-${index}`}>
														<TooltipTrigger
															render={
																<Badge
																	className={
																		badge.className
																			? `${badge.className} rounded-sm shadow-sm`
																			: 'h-5 rounded-sm text-xs shadow-sm'
																	}
																	onClick={event => {
																		if (!badge.onClick) return
																		event.stopPropagation()
																		badge.onClick()
																	}}
																	onKeyDown={event => {
																		if (
																			(event.key === 'Enter' ||
																				event.key === ' ') &&
																			badge.onClick
																		) {
																			event.preventDefault()
																			event.stopPropagation()
																			badge.onClick()
																		}
																	}}
																	role={badge.onClick ? 'button' : undefined}
																	tabIndex={badge.onClick ? 0 : undefined}
																	variant={badge.variant ?? 'outline'}
																>
																	{badge.label ? (
																		<span>{badge.label}</span>
																	) : null}
																</Badge>
															}
														/>
														{badge.tooltip ? (
															<TooltipContent>{badge.tooltip}</TooltipContent>
														) : null}
													</Tooltip>
												))}
											</div>
										</div>

										<Textarea
											className='!bg-transparent !text-3xl m-0 min-h-0 resize-none overflow-hidden break-words rounded-none border-none p-0 pb-1 font-bold leading-tight shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
											onBlur={flushPrompt}
											onChange={onPromptChange}
											placeholder='Untitled prompt'
											spellCheck={false}
											value={prompt}
										/>

										<div className='flex flex-wrap items-center gap-2 text-sm'>
											{isUnreviewed ? (
												<div className='flex items-center gap-1.5 font-semibold text-muted-foreground'>
													<Sparkles className='h-4 w-4' />
													<span>Unreviewed</span>
												</div>
											) : (
												<>
													<Tooltip>
														<TooltipTrigger
															render={
																<div
																	className={`flex items-center gap-1.5 font-semibold ${freshnessTierColor}`}
																>
																	<Brain className='h-4 w-4' />
																	<span>{freshnessTierInfo.label}</span>
																</div>
															}
														/>
														<TooltipContent>
															{freshnessTierInfo.tooltip ??
																'Complete a review to see freshness tier'}
														</TooltipContent>
													</Tooltip>
													{latestCompletedReview ? (
														<>
															<span aria-hidden={true} className='font-bold'>
																·
															</span>
															<Tooltip>
																<TooltipTrigger
																	render={
																		<Button
																			className='h-auto gap-1 p-0 font-semibold text-muted-foreground text-sm'
																			onClick={() =>
																				openReviewDialog(
																					latestCompletedReview.id
																				)
																			}
																			size='default'
																			variant='link'
																		>
																			<span>{`Reviewed ${lastReviewed.text}`}</span>
																			{latestCompletedReview.rating ? (
																				<span className='flex size-4 shrink-0 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground dark:bg-primary'>
																					{getRatingIcon(
																						latestCompletedReview.rating
																					)}
																				</span>
																			) : null}
																		</Button>
																	}
																/>
																<TooltipContent>
																	{formatAbsoluteDate(
																		latestCompletedReview.completed_at
																	)}
																</TooltipContent>
															</Tooltip>
														</>
													) : null}
													<span className='font-bold'>·</span>
													<Tooltip>
														<TooltipTrigger
															render={
																<div className='flex items-center gap-1.5 font-semibold text-muted-foreground'>
																	<Anvil className='h-4 w-4' />
																	<span>{`${stabilityText} durability`}</span>
																</div>
															}
														/>
														<TooltipContent>
															Lasts {stabilityText} before getting hazy
														</TooltipContent>
													</Tooltip>
												</>
											)}
											<div className='ml-auto flex items-center gap-2 font-semibold text-muted-foreground text-sm'>
												<Tooltip>
													<TooltipTrigger
														render={
															<span>{`Edited ${formatRelativeDate(reviewCard.updated_at).text}`}</span>
														}
													/>
													<TooltipContent>
														{dayjs(reviewCard.updated_at).format('MMM D, YYYY')}
													</TooltipContent>
												</Tooltip>
												<span aria-hidden={true}>·</span>
												<Tooltip>
													<TooltipTrigger
														render={
															<span>{`Created ${formatRelativeDate(reviewCard.inserted_at).text}`}</span>
														}
													/>
													<TooltipContent>
														{dayjs(reviewCard.inserted_at).format(
															'MMM D, YYYY'
														)}
													</TooltipContent>
												</Tooltip>
											</div>
										</div>

										<div className='my-3 flex flex-wrap items-center justify-between border-y-1 py-2'>
											<div className='flex items-center gap-2'>
												<RatingDropdown
													align='end'
													onSelect={handleRatingSelect}
													trigger={
														<Button
															className='rounded-full'
															disabled={createReviewMutation.isPending}
															size='sm'
														>
															{createReviewMutation.isPending ? (
																<Loader2 className='h-4 w-4 animate-spin' />
															) : (
																<Plus className='h-4 w-4' />
															)}
															<span>Review</span>
															<ChevronDown className='h-4 w-4' />
														</Button>
													}
												/>
												<Tooltip>
													<TooltipTrigger
														render={
															<Button
																aria-label={
																	reviewCard.flagged_at
																		? 'Unflag this item'
																		: 'Flag this item'
																}
																aria-pressed={reviewCard.flagged_at != null}
																className='rounded-full'
																disabled={isUpdatingReviewCard}
																onClick={() =>
																	handleUpdateReviewCardFields({
																		flagged: reviewCard.flagged_at == null
																	})
																}
																size='icon-sm'
																variant='outline'
															>
																<Flag
																	className={
																		reviewCard.flagged_at
																			? FLAGGED_ICON_CLASSNAME
																			: 'h-4 w-4 text-muted-foreground'
																	}
																/>
															</Button>
														}
													/>
													<TooltipContent>
														{reviewCard.flagged_at ? 'Unflag' : 'Flag'}
													</TooltipContent>
												</Tooltip>
												<Tooltip>
													<TooltipTrigger
														render={<span className='inline-flex' />}
													>
														<Button
															aria-label={
																reviewCard.retired
																	? 'Return this item to review queue'
																	: 'Retire this item'
															}
															aria-pressed={reviewCard.retired}
															className='rounded-full'
															disabled={isUpdatingReviewCard}
															onClick={handleRetiredToggle}
															size='icon-sm'
															variant='outline'
														>
															{reviewCard.retired ? (
																<Sunset className='h-4 w-4 text-orange-500' />
															) : (
																<Sunset className='h-4 w-4 text-muted-foreground' />
															)}
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														{reviewCard.retired
															? 'Show in review queue'
															: 'Hide from review queue'}
													</TooltipContent>
												</Tooltip>
											</div>
											<div className='flex items-center justify-end'>
												<DropdownMenu>
													<DropdownMenuTrigger
														render={
															<Button
																size='icon-sm'
																type='button'
																variant='ghost'
															>
																<MoreHorizontal className='h-4 w-4' />
															</Button>
														}
													/>
													<DropdownMenuContent
														align='end'
														side='bottom'
														sideOffset={4}
													>
														<DropdownMenuItem
															disabled={isDeletingReviewCard}
															onClick={() => setIsDeleteDialogOpen(true)}
															variant='destructive'
														>
															<Trash2 className='mr-2 h-4 w-4' />
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										</div>

										{hidesSecondary ? (
											<RevealPanel
												className='flex min-h-0 flex-1 flex-col'
												closedContent={
													isAnswerEmpty ? (
														<Badge
															className={`${EMPTY_BADGE_CLASSNAME} pointer-events-none absolute top-2 right-2`}
															variant='outline'
														>
															Empty
														</Badge>
													) : null
												}
												guessValue={guessAnswerText}
												isCopied={isRevealPanelCopied}
												onGuessCopy={handleCopyGuessText}
												onGuessValueChange={setGuessAnswerText}
												onRevealBlur={flushAnswer}
												onRevealCopy={handleCopyRevealText}
												onRevealValueChange={setAnswer}
												onValueChange={setRevealPanelTab}
												revealHelperVariant='autosave'
												revealPlaceholder='Write your answer...'
												revealValue={answer}
												value={revealPanelTab}
												variant='detail'
											/>
										) : (
											<div className='flex min-h-0 flex-1 flex-col'>
												<Textarea
													className='!bg-transparent field-sizing-fixed m-0 h-full min-h-[2lh] flex-1 resize-none overflow-hidden break-words rounded-none border-none p-0 text-base leading-relaxed shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
													onBlur={flushAnswer}
													onChange={onAnswerChange}
													placeholder='Write your answer...'
													spellCheck={false}
													value={answer}
												/>
											</div>
										)}
									</div>
								)
							})()}
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
					if (!reviewCard) return
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
