import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { Layers, Loader2, Sunset } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ReviewCardPageLayout } from '~/app/components/ReviewCardPageLayout'
import { Button } from '~/components/ui/button'
import { CountBadge } from '~/components/ui/count-badge'
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { useReviewCardQueuePage } from '~/features/review-cards/api/getReviewCardQueue'
import { useUpdateReviewCard } from '~/features/review-cards/api/updateReviewCard'
import { RetireReviewCardDialog } from '~/features/review-cards/components/RetireReviewCardDialog'
import { ReviewCard } from '~/features/review-cards/components/ReviewCard'
import { ReviewCardSectionList } from '~/features/review-cards/components/ReviewCardSectionList'
import { useReviewCardQueueCounts } from '~/features/review-cards/hooks/useReviewCardQueueCounts'
import { groupReviewCardQueueByActionDay } from '~/features/review-cards/utils/groupReviewCardQueueByActionDay'
import { groupReviewCardQueueByCreatedDay } from '~/features/review-cards/utils/groupReviewCardQueueByCreatedDay'
import { hasScheduledDueReviews } from '~/features/review-cards/utils/hasScheduledDueReviews'
import { useCreateReview } from '~/features/reviews/api/createReview'
import { cn } from '~/lib/utils'
import { useWeekStart } from '~/stores/WeekStartContext'
import { getRatingIcon } from '~/utils/getRatingIcon'

export type FlashcardsTab = 'due' | 'new'
export type FlashcardsScope = 'focused' | 'all'

const FLASHCARD_SCOPE_OPTIONS = [
	{ label: 'Focused', value: 'focused' },
	{ label: 'All', value: 'all' }
] as const

type FlashcardsPageProps = {
	activeTab: FlashcardsTab
	scope?: FlashcardsScope
	onActiveTabChange: (tab: FlashcardsTab) => void
	onScopeChange: (scope: FlashcardsScope) => void
}

export function FlashcardsPage({
	activeTab,
	scope = 'focused',
	onActiveTabChange,
	onScopeChange
}: FlashcardsPageProps) {
	const navigate = useNavigate()
	const { weekStartDay } = useWeekStart()
	const isFocusedDueView = activeTab === 'due' && scope === 'focused'
	const { dueNextSevenDaysCount, dueTodayCount, newCount, overdueCount } =
		useReviewCardQueueCounts({
			type: 'flashcard'
		})
	const { data: queuePage, isLoading } = useReviewCardQueuePage({
		type: 'flashcard',
		tab: activeTab,
		focused: activeTab === 'due' ? scope === 'focused' : undefined
	})
	const items = queuePage?.items ?? []
	const focusedItems = useMemo(
		() =>
			isFocusedDueView
				? items.filter(item => item.card.freshness_tier !== 'Fresh')
				: items,
		[items, isFocusedDueView]
	)
	const createReviewMutation = useCreateReview()
	const updateReviewCardMutation = useUpdateReviewCard()
	const [isRetireDialogOpen, setIsRetireDialogOpen] = useState(false)
	const tabOptions = useMemo(
		() => [
			{
				label: 'Due',
				value: 'due' as const,
				count: (
					<>
						{overdueCount > 0 ? (
							<CountBadge
								className='h-4 min-w-4 bg-red-600 px-1 text-[10px] text-white dark:bg-red-400'
								count={overdueCount}
							/>
						) : null}
						{dueTodayCount > 0 ? (
							<CountBadge
								className='h-4 min-w-4 bg-transparent px-1 text-[10px] text-blue-600 dark:text-blue-400'
								count={dueTodayCount}
							/>
						) : null}
					</>
				)
			},
			{
				label: 'New',
				value: 'new' as const,
				count: (
					<CountBadge
						className='h-4 min-w-4 px-1 text-[10px]'
						count={newCount}
					/>
				)
			}
		],
		[dueTodayCount, newCount, overdueCount]
	)
	const dueSummary = useMemo(() => {
		if (activeTab !== 'due') return null

		return (
			<div className='flex items-center gap-2 text-muted-foreground text-sm'>
				<span>Due in next 7d</span>
				<CountBadge count={dueNextSevenDaysCount} />
			</div>
		)
	}, [activeTab, dueNextSevenDaysCount])

	const activeCard = useMemo(
		() => focusedItems[0]?.card ?? null,
		[focusedItems]
	)
	const dueSections = useMemo(
		() =>
			groupReviewCardQueueByActionDay(items, weekStartDay, queuePage?.as_of),
		[items, queuePage?.as_of, weekStartDay]
	)
	const newSections = useMemo(
		() =>
			groupReviewCardQueueByCreatedDay(items, weekStartDay, queuePage?.as_of),
		[items, queuePage?.as_of, weekStartDay]
	)
	const retireLabel = 'Retire'
	const retireAriaLabel = activeCard?.retired
		? 'Return this item to review queue'
		: 'Retire this item'
	let retireIcon: ReactNode = (
		<Sunset className='h-4 w-4 text-muted-foreground' />
	)
	if (updateReviewCardMutation.isPending) {
		retireIcon = <Loader2 className='h-4 w-4 animate-spin' />
	} else if (activeCard?.retired) {
		retireIcon = <Sunset className='h-4 w-4 text-orange-500' />
	}

	useEffect(() => {
		if (activeCard?.id == null) {
			setIsRetireDialogOpen(false)
			return
		}
		setIsRetireDialogOpen(false)
	}, [activeCard?.id])

	async function rateCard(rating: 'miss' | 'hard' | 'good' | 'easy') {
		if (!activeCard) return
		try {
			await createReviewMutation.mutateAsync({
				review_card_id: activeCard.id,
				rating,
				completed_at: dayjs().format('YYYY-MM-DD')
			})
		} catch {
			toast.error('Failed to record review')
		}
	}

	async function confirmToggleRetired() {
		if (!activeCard) return
		try {
			await updateReviewCardMutation.mutateAsync({
				id: activeCard.id,
				retired: !activeCard.retired
			})
			setIsRetireDialogOpen(false)
		} catch {
			toast.error('Failed to update review card')
		}
	}

	async function toggleRetired() {
		if (!activeCard) return
		if (!activeCard.retired && hasScheduledDueReviews(activeCard)) {
			setIsRetireDialogOpen(true)
			return
		}
		await confirmToggleRetired()
	}

	function handleSeeReviews() {
		if (!activeCard) return
		setIsRetireDialogOpen(false)
		navigate({
			to: '/review-cards/$reviewCardId',
			params: { reviewCardId: activeCard.id.toString() },
			search: { tab: 'reviews' }
		})
	}

	function handleConfirmRetired() {
		confirmToggleRetired().catch(() => {})
	}

	let content: ReactNode
	if (isLoading) {
		content = <LoadingSpinner containerClassName='min-h-64' />
	} else if (isFocusedDueView && focusedItems.length === 0) {
		content = (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant='icon'>
						<Layers />
					</EmptyMedia>
					<EmptyTitle>
						You're all caught up! All remaining cards are still fresh.
					</EmptyTitle>
				</EmptyHeader>
			</Empty>
		)
	} else if (items.length === 0) {
		content = (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant='icon'>
						<Layers />
					</EmptyMedia>
					<EmptyTitle>No flashcards in this view</EmptyTitle>
				</EmptyHeader>
			</Empty>
		)
	} else if (isFocusedDueView && activeCard) {
		content = (
			<div className='mx-auto w-full max-w-3xl space-y-4'>
				<ReviewCard
					enableLargeCardMode={true}
					minHeight={380}
					onClick={() =>
						navigate({
							to: '/review-cards/$reviewCardId',
							params: { reviewCardId: activeCard.id.toString() },
							search: { tab: 'home' }
						})
					}
					reviewCard={activeCard}
				/>
				<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
					<div className='flex flex-wrap items-center gap-2'>
						<Button onClick={() => rateCard('miss')} variant='outline'>
							<span className='flex items-center gap-2'>
								{getRatingIcon('miss')}
								<span>Miss</span>
							</span>
						</Button>
						<Button onClick={() => rateCard('hard')} variant='outline'>
							<span className='flex items-center gap-2'>
								{getRatingIcon('hard')}
								<span>Hard</span>
							</span>
						</Button>
						<Button onClick={() => rateCard('good')} variant='outline'>
							<span className='flex items-center gap-2'>
								{getRatingIcon('good')}
								<span>Good</span>
							</span>
						</Button>
						<Button onClick={() => rateCard('easy')} variant='outline'>
							<span className='flex items-center gap-2'>
								{getRatingIcon('easy')}
								<span>Easy</span>
							</span>
						</Button>
					</div>
					<div className='flex justify-start sm:justify-end'>
						<Button
							aria-label={retireAriaLabel}
							aria-pressed={activeCard.retired}
							className={cn(
								activeCard.retired && 'bg-muted text-foreground hover:bg-muted'
							)}
							disabled={updateReviewCardMutation.isPending}
							onClick={() => toggleRetired()}
							variant='ghost'
						>
							<span className='flex items-center gap-2'>
								{retireIcon}
								<span>{retireLabel}</span>
							</span>
						</Button>
					</div>
				</div>
			</div>
		)
	} else {
		const sections = activeTab === 'due' ? dueSections : newSections
		content = (
			<ReviewCardSectionList
				onCardClick={cardId =>
					navigate({
						to: '/review-cards/$reviewCardId',
						params: { reviewCardId: cardId.toString() },
						search: { tab: 'home' }
					})
				}
				sections={sections}
			/>
		)
	}

	return (
		<ReviewCardPageLayout
			activeTab={activeTab}
			icon={Layers}
			isDueView={activeTab === 'due'}
			isFocusedDueView={isFocusedDueView}
			onActiveTabChange={onActiveTabChange}
			onScopeChange={onScopeChange}
			scope={scope}
			scopeBarActions={dueSummary}
			scopeOptions={FLASHCARD_SCOPE_OPTIONS}
			tabOptions={tabOptions}
			title='Flashcards'
		>
			{content}
			<RetireReviewCardDialog
				isPending={updateReviewCardMutation.isPending}
				onConfirm={handleConfirmRetired}
				onOpenChange={setIsRetireDialogOpen}
				onSeeReviews={handleSeeReviews}
				open={isRetireDialogOpen}
			/>
		</ReviewCardPageLayout>
	)
}
