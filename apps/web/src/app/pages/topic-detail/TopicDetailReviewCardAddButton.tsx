import { Plus } from 'lucide-react'

import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { cn } from '~/lib/utils'
import { type ReviewCardType } from '~/modules/review-cards/types/review-card.types'

import { type TopicDetailReviewCardControlsVariant } from './shared'
import {
	getReviewCardControlClassName,
	getReviewCardControlSize,
} from './topicDetailReviewCardControlStyles'

export function TopicDetailReviewCardAddButton({
	controlsVariant,
	isCreatingReviewCard,
	onAddReviewCard,
}: {
	controlsVariant: TopicDetailReviewCardControlsVariant
	isCreatingReviewCard: boolean
	onAddReviewCard: (type: ReviewCardType) => void
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						className={cn(
							'shrink-0',
							getReviewCardControlClassName(controlsVariant),
						)}
						disabled={isCreatingReviewCard}
						size={getReviewCardControlSize(controlsVariant)}
						variant='secondary'
					>
						<Plus />
						Add
					</Button>
				}
			/>
			<DropdownMenuContent align='end'>
				<DropdownMenuItem onClick={() => onAddReviewCard('practice')}>
					Practice
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => onAddReviewCard('flashcard')}>
					Flashcard
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
