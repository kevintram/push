import type { Topic } from '~/models/review-topic.types'

export type GetTopicsParams = {
	root?: boolean
	inboxed?: boolean
	archived?: boolean
	srsEnabled?: boolean
	order?: 'desc' | 'asc'
	limit?: number
	dueBefore?: string
	dueAfter?: string
}

export type SearchTopicsParams = {
	query?: string
	limit?: number
	addableToReview?: number
	addableAsParentTo?: number
	addableAsChildTo?: number
}

export type CreateTopicInput = {
	name?: string
	notes?: string
	stability?: number | null
	difficulty?: number | null
	state?: 'LEARNING' | 'REVIEW' | 'RELEARNING'
	archived?: boolean
	inboxed?: boolean
}

export type UpdateTopicInput = {
	id: number
	name?: string
	notes?: string
	archived?: boolean
	inboxed?: boolean
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
			}
	  }

export type CreateRelationshipInput =
	| { parent: number; child: number }
	| {
			parent: number
			childData: Pick<Topic, 'name' | 'notes' | 'archived' | 'inboxed'>
	  }
	| {
			child: number
			parentData: Pick<Topic, 'name' | 'notes' | 'archived' | 'inboxed'>
	  }

export type DeleteChildRelationshipInput = {
	parentId: number
	childId: number
}

export type DeleteParentRelationshipInput = {
	childId: number
	parentId: number
}
