import { ChevronDown, Plus } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { RatingDropdown } from './RatingDropdown'
import type { ReviewRatingState } from './ReviewRatingCheckbox'

interface AddFirstReviewButtonProps {
	onSelectRating: (rating: ReviewRatingState) => void
}

export function AddFirstReviewButton({
	onSelectRating
}: AddFirstReviewButtonProps) {
	return (
		<div className='flex justify-center'>
			<RatingDropdown
				align='center'
				onSelect={onSelectRating}
				trigger={
					<Button
						className='bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 dark:text-blue-400'
						size='sm'
						variant='secondary'
					>
						<Plus />
						Add first review
						<ChevronDown />
					</Button>
				}
			/>
		</div>
	)
}
