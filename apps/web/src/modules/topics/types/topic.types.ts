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
	parent_id?: number
	subtree_of?: number
	sort?: 'updated_at' | 'title'
	order?: 'asc' | 'desc'
}

export type UpdateTopicInput = {
	id: number
	title?: string
	body?: string
	parent_id?: number | null
}
