import { useNavigate } from '@tanstack/react-router'
import { CalendarIcon, Focus } from 'lucide-react'
import type { ReactNode } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import { Toggle } from '~/components/ui/toggle'
import { useReviewCardQueueCounts } from '~/features/review-cards/hooks/useReviewCardQueueCounts'
import type { ReviewFocusSearch } from '~/features/review-cards/reviewFocusSearch'
import type {
	ReviewFilter,
	ReviewFocusOrder
} from '~/features/review-cards/types/review-card.types'
import { DueHeaderControls, DueQueueStatusBadges } from './DueHeaderControls'

interface DuePageLayoutProps {
	children: ReactNode
	contentClassName?: string
	filter: ReviewFilter
	focusSearch: ReviewFocusSearch
	isFocusActive: boolean
	onFilterChange: (filter: ReviewFilter) => void
	onOrderChange: (order: ReviewFocusOrder) => void
	onShuffle: () => void
	order: ReviewFocusOrder
}

export function DuePageLayout({
	children,
	contentClassName,
	filter,
	focusSearch,
	isFocusActive,
	onFilterChange,
	onOrderChange,
	onShuffle,
	order
}: DuePageLayoutProps) {
	const navigate = useNavigate()
	const { dueTodayCount, newCount, overdueCount } = useReviewCardQueueCounts({
		filter: 'all'
	})
	const practiceCounts = useReviewCardQueueCounts({ filter: 'practice' })
	const flashcardsCounts = useReviewCardQueueCounts({ filter: 'flashcards' })

	function handleFocusToggle() {
		if (isFocusActive) {
			navigate({ to: '/due', search: { filter } })
			return
		}
		navigate({ to: '/due/focus', search: focusSearch })
	}

	return (
		<PageLayout>
			<PageLayout.Header
				actions={
					<Toggle
						aria-label='Focus'
						className='h-8 rounded-full px-2.5'
						onPressedChange={handleFocusToggle}
						pressed={isFocusActive}
						size='sm'
						variant='outline'
					>
						<Focus />
						Focus
					</Toggle>
				}
				icon={CalendarIcon}
				title='Due'
				titleExtra={
					<DueQueueStatusBadges
						dueTodayCount={dueTodayCount}
						newCount={newCount}
						overdueCount={overdueCount}
					/>
				}
			/>
			<PageLayout.Content
				className={contentClassName}
				controls={
					<DueHeaderControls
						filter={filter}
						filterStatusCounts={{
							flashcards: flashcardsCounts,
							practice: practiceCounts
						}}
						onFilterChange={onFilterChange}
						onOrderChange={onOrderChange}
						onShuffle={onShuffle}
						order={order}
						showFocusOrderControls={isFocusActive}
					/>
				}
			>
				{children}
			</PageLayout.Content>
		</PageLayout>
	)
}
