import { Check, CheckCheck, Construction, X } from 'lucide-react'

import type { Rating } from '../types/review.types'

export const ratings = {
	miss: { label: 'Miss', Icon: X },
	hard: { label: 'Hard', Icon: Construction },
	good: { label: 'Good', Icon: Check },
	easy: { label: 'Easy', Icon: CheckCheck },
} as const

export function getRating(value: Rating | undefined) {
	return value === undefined ? null : ratings[value]
}
