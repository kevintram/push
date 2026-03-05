export type Topic = {
	id: number
	title: string
	body: string
	parent_id: number | null
	parent_title: string | null
	inserted_at: string
	updated_at: string
}

export type GetTopicsParams = {
	root?: boolean
	parent_id?: number
	order?: 'asc' | 'desc'
}

export type UpdateTopicInput = {
	id: number
	title?: string
	body?: string
	parent_id?: number | null
}
