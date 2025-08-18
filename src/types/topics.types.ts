// export interface Topic {
// 	id: string
// 	title: string
// 	notes: string
// 	created: Date
// 	stability: number // a number in days
// 	retrievability: number // a percentage
// 	children: Array<Topic>
// 	parents: Array<string>
// 	practicePrompts: Array<PracticePrompt>
// 	timeline: Array<TimelineEntry>
// }

import type { Tables } from './database.types'

// Base Supabase table types
type TableTopic = Tables<'topics'>
export type TimelineEntry = Tables<'timeline_entries'>

// enhanced topic type for now while we have partial implementation
export type Topic = TableTopic & {
	timeline_entries: Array<TimelineEntry>
	parents: Array<string>
	children: Array<Topic>
	practicePrompts: Array<PracticePrompt>
}

export interface PracticePrompt {
	id: string
	title: string
	content: string
}
