import { createContext } from 'react'
import type { Review } from '../types/review.types'

export const ReviewContext = createContext<{
	review: Review | undefined
	isLoading: boolean
}>({
	review: undefined,
	isLoading: false
})
