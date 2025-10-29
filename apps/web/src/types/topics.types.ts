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
	user_id?: string
	parents?: Array<Topic>
	children?: Array<Topic>
}

export interface PracticePrompt {
	id: string
	title: string
	content: string
}
