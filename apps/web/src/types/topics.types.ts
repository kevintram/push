import type { Tables } from './database.types'

export type Topic = Tables<'topics'> & {
	parents?: Array<Topic>
	children?: Array<Topic>
}

export interface PracticePrompt {
	id: string
	title: string
	content: string
}
