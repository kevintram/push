export type Topic = {
	id: number
	title: string
	body: string
	parentId: number | null
	parentTitle: string | null
	insertedAt: string
	updatedAt: string
}

export type GetTopicsParams = {
	root?: boolean
	parent_id?: number
	subtree_of?: number
	sort?: 'updated_at' | 'title'
	order?: 'asc' | 'desc'
}

export type UpdateTopicInput = {
	id: number
	title?: string
	body?: string
	parentId?: number | null
}
