import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { Layers } from 'lucide-react'
import { type ReactNode, useMemo } from 'react'
import { toast } from 'sonner'
import { ReviewCardPageLayout } from '~/app/components/ReviewCardPageLayout'
import { Button } from '~/components/ui/button'
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { useReviewCardQueue } from '~/features/review-cards/api/getReviewCardQueue'
import { ReviewCard } from '~/features/review-cards/components/ReviewCard'
import { ReviewCardSectionList } from '~/features/review-cards/components/ReviewCardSectionList'
import { groupReviewCardQueueByDueDate } from '~/features/review-cards/utils/groupReviewCardQueueByDueDate'
import { useCreateReview } from '~/features/reviews/api/createReview'
import { getRatingIcon } from '~/utils/getRatingIcon'
import { groupByDate } from '~/utils/groupByDate'

export type FlashcardsTab = 'due' | 'new'
export type FlashcardsScope = 'focused' | 'all'

const FLASHCARD_TAB_OPTIONS = [
	{ label: 'Due', value: 'due' },
	{ label: 'New', value: 'new' }
] as const

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
	const isFocusedDueView = activeTab === 'due' && scope === 'focused'
	const { data: items = [], isLoading } = useReviewCardQueue({
		type: 'flashcard',
		tab: activeTab,
		focused: activeTab === 'due' ? scope === 'focused' : undefined
	})
	const createReviewMutation = useCreateReview()

	const activeCard = useMemo(() => items[0]?.card ?? null, [items])
	const dueSections = useMemo(
		() => groupReviewCardQueueByDueDate(items),
		[items]
	)
	const newSections = useMemo(
		() =>
			groupByDate(
				items.map(item => ({
					item,
					date: item.card.inserted_at
				}))
			),
		[items]
	)

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

	let content: ReactNode
	if (isLoading) {
		content = <LoadingSpinner containerClassName='min-h-64' />
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
					minHeight={380}
					onClick={() =>
						navigate({
							to: '/review-cards/$reviewCardId',
							params: { reviewCardId: activeCard.id.toString() }
						})
					}
					reviewCard={activeCard}
				/>
				<div className='flex flex-wrap items-center justify-center gap-2'>
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
			</div>
		)
	} else {
		const sections = activeTab === 'due' ? dueSections : newSections
		content = (
			<ReviewCardSectionList
				onCardClick={cardId =>
					navigate({
						to: '/review-cards/$reviewCardId',
						params: { reviewCardId: cardId.toString() }
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
			scopeOptions={FLASHCARD_SCOPE_OPTIONS}
			tabOptions={FLASHCARD_TAB_OPTIONS}
			title='Flashcards'
		>
			{content}
		</ReviewCardPageLayout>
	)
}
