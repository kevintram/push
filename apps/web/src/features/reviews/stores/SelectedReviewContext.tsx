import { createContext } from 'react'
import type { ReviewSession } from '../types/review.types'

export const ReviewContext = createContext<{
	review: ReviewSession | undefined
	isLoading: boolean
}>({
	review: undefined,
	isLoading: false
})
