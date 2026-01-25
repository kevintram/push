import { createContext } from 'react'
import type { Practice } from '../types/practice.types'

export const PracticeContext = createContext<{
	practice: Practice | undefined
	isLoading: boolean
}>({
	practice: undefined,
	isLoading: false
})
