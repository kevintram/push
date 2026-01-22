import { createContext } from 'react'
import type { Source } from '../types/source.types'

export const SourceContext = createContext<{
	source: Source | undefined
	isLoading: boolean
}>({
	source: undefined,
	isLoading: false
})
