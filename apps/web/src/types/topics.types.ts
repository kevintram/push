import type { Todo } from '~/features/todos/api/schemas'

export type Topic = {
	id: number
	name: string
	notes: string
	inserted_at: string
	updated_at: string
	stability: number
	retrievability: number
	archived: boolean
	inboxed: boolean
	parents?: Array<Topic>
	children?: Array<Topic>
	todos?: Array<Todo>
}

export interface PracticePrompt {
	id: string
	title: string
	content: string
}
