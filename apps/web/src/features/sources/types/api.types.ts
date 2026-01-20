export type GetSourcesParams = {
	root?: boolean
	inboxed?: boolean
	archived?: boolean
	srsEnabled?: boolean
	order?: 'desc' | 'asc'
	limit?: number
	hasStability?: boolean
}

export type CreateSourceInput = {
	title?: string
	notes?: string
	archived?: boolean
	inboxed?: boolean
	parent_id?: number | null
	srs_enabled?: boolean
	inherit_fsrs?: boolean
}

export type UpdateSourceInput = {
	id: number
	title?: string
	notes?: string
	archived?: boolean
	inboxed?: boolean
	parent_id?: number | null
	srs_enabled?: boolean
}

export type CreateSourceChildRelationshipInput =
	| {
			parentId: number
			childId: number
	  }
	| {
			parentId: number
			child: {
				title: string
				notes: string
				archived: boolean
				inboxed: boolean
				srs_enabled?: boolean
				inherit_fsrs?: boolean
			}
	  }

export type AddSourceTopicInput = {
	sourceId: number
	topicId: number
}

export type DeleteSourceChildRelationshipInput = {
	parentId: number
	childId: number
}
