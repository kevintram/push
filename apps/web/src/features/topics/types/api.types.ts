import type { Topic } from './topic.types'

export type GetTopicsParams = {
	root?: boolean
	inboxed?: boolean
	archived?: boolean
	srsEnabled?: boolean
	order?: 'desc' | 'asc'
	limit?: number
	hasStability?: boolean
	scheduled?: boolean
}

export type SearchTopicsParams = {
	query?: string
	limit?: number
	addableToReview?: number
	addableAsParentTo?: number
	addableAsChildTo?: number
	addableAsRelatedTo?: number
}

export type CreateTopicInput = {
	name?: string
	notes?: string
	archived?: boolean
	inboxed?: boolean
	parent_id?: number | null
	srs_enabled?: boolean
	inherit_fsrs?: boolean
}

export type UpdateTopicInput = {
	id: number
	name?: string
	notes?: string
	archived?: boolean
	inboxed?: boolean
	parent_id?: number | null
	srs_enabled?: boolean
}

export type CreateChildRelationshipInput =
	| {
			parentId: number
			childId: number
	  }
	| {
			parentId: number
			child: {
				name: string
				notes: string
				archived: boolean
				inboxed: boolean
				srs_enabled?: boolean
				inherit_fsrs?: boolean
			}
	  }

export type CreateParentRelationshipInput =
	| {
			childId: number
			parentId: number
	  }
	| {
			childId: number
			parent: {
				name: string
				notes: string
				archived: boolean
				inboxed: boolean
				srs_enabled?: boolean
				inherit_fsrs?: boolean
			}
	  }

export type CreateRelationshipInput =
	| { parent: number; child: number }
	| {
			parent: number
			childData: Pick<
				Topic,
				'name' | 'notes' | 'archived' | 'inboxed' | 'srs_enabled'
			> & {
				inherit_fsrs?: boolean
			}
	  }
	| {
			child: number
			parentData: Pick<
				Topic,
				'name' | 'notes' | 'archived' | 'inboxed' | 'srs_enabled'
			> & {
				inherit_fsrs?: boolean
			}
	  }

export type DeleteChildRelationshipInput = {
	parentId: number
	childId: number
}

export type DeleteParentRelationshipInput = {
	childId: number
	parentId: number
}
