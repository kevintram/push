import { Check, ChevronDown, Plus } from 'lucide-react'
import { useCallback } from 'react'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { getRatingIcon } from '~/utils/getRatingIcon'
import type { Rating } from '../../types/review.types'

interface TopicReviewStatusButton {
	isAdded: boolean
	isReviewCompleted: boolean
	rating?: Rating | null
	onAdd: () => void
	onRemove: () => void
	onRatingChange?: (rating: Rating) => void
}

export function TopicReviewStatusButton({
	isAdded,
	isReviewCompleted,
	rating,
	onAdd,
	onRemove,
	onRatingChange
}: TopicReviewStatusButton) {
	const handleRatingSelect = useCallback(
		(newRating: Rating) => {
			onRatingChange?.(newRating)
		},
		[onRatingChange]
	)

	// State 1: Not added - show Add button
	if (!isAdded) {
		return (
			<Button
				className='!p-2 h-6 gap-1 rounded-lg'
				onClick={e => {
					e.stopPropagation()
					onAdd()
				}}
				variant='secondary'
			>
				<Plus />
				Add
			</Button>
		)
	}

	// State 2: Added but review not completed - show Added button
	if (!isReviewCompleted) {
		return (
			<Button
				className='!p-2 h-6 gap-1 rounded-lg text-green-400'
				onClick={e => {
					e.stopPropagation()
					onRemove()
				}}
				variant='secondary'
			>
				<Check />
				Added
			</Button>
		)
	}

	// State 3: Added and review completed - show rating dropdown
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild={true}>
				<Button
					className='!p-2 h-6 gap-1 rounded-lg text-green-400 capitalize'
					onClick={e => e.stopPropagation()}
					variant='secondary'
				>
					{getRatingIcon(rating)}
					{rating || 'Rate'}
					<ChevronDown className='h-3 w-3' />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='start' side='bottom' sideOffset={2}>
				<DropdownMenuItem
					onClick={e => {
						e.stopPropagation()
						handleRatingSelect('miss')
					}}
				>
					{getRatingIcon('miss')}
					<span className='ml-2 capitalize'>Miss</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={e => {
						e.stopPropagation()
						handleRatingSelect('hard')
					}}
				>
					{getRatingIcon('hard')}
					<span className='ml-2 capitalize'>Hard</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={e => {
						e.stopPropagation()
						handleRatingSelect('good')
					}}
				>
					{getRatingIcon('good')}
					<span className='ml-2 capitalize'>Good</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={e => {
						e.stopPropagation()
						handleRatingSelect('easy')
					}}
				>
					{getRatingIcon('easy')}
					<span className='ml-2 capitalize'>Easy</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
