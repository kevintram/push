import { createContext } from 'react'
import type { Review } from '~/models/review-topic.types'

export const ReviewContext = createContext<{
	review: Review | undefined
	isLoading: boolean
}>({
	review: undefined,
	isLoading: false
})
