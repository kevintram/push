import { Circle } from 'lucide-react'
import { type ReactNode } from 'react'

import { getRatingIcon } from '~/utils/getRatingIcon'

import { type Rating } from '../types/review.types'

export type ReviewRatingState = 'uncompleted' | Rating

export const ratingOptions: Array<{ value: ReviewRatingState; label: string }> =
	[
		{ value: 'uncompleted', label: 'Uncompleted' },
		{ value: 'miss', label: 'Miss' },
		{ value: 'hard', label: 'Hard' },
		{ value: 'good', label: 'Good' },
		{ value: 'easy', label: 'Easy' },
	]

function EmptyRatingIcon() {
	return <Circle className='h-3 w-3' />
}

export function getOptionIcon(option: ReviewRatingState): ReactNode {
	if (option === 'uncompleted') return <EmptyRatingIcon />
	return getRatingIcon(option)
}
