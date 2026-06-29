import { Check, CheckCheck, Construction, X } from 'lucide-react'

import { type Rating } from '~/modules/reviews/types/review.types'

export function getRatingIcon(rating: Rating | null | undefined) {
	if (!rating) return null
	switch (rating) {
		case 'miss':
			return <X className='h-3 w-3' />
		case 'hard':
			return <Construction className='h-3 w-3' />
		case 'good':
			return <Check className='h-3 w-3' />
		case 'easy':
			return <CheckCheck className='h-3 w-3' />
		default:
			return null
	}
}
