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
	stability?: number | null
	inherited_stability?: number | null
	inherited_difficulty?: number | null
	inherited_state?: 'LEARNING' | 'REVIEW' | 'RELEARNING' | null
	inherited_step?: number | null
	inherited_last_review?: string | null
	difficulty?: number | null
	state?: 'LEARNING' | 'REVIEW' | 'RELEARNING'
	step?: number | null
	archived?: boolean
	inboxed?: boolean
	srs_enabled?: boolean
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
				stability?: number | null
				difficulty?: number | null
				state?: 'LEARNING' | 'REVIEW' | 'RELEARNING'
				step?: number | null
				inherited_stability?: number | null
				inherited_difficulty?: number | null
				inherited_state?: 'LEARNING' | 'REVIEW' | 'RELEARNING' | null
				inherited_step?: number | null
				inherited_last_review?: string | null
				srs_enabled?: boolean
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
				stability?: number | null
				difficulty?: number | null
				state?: 'LEARNING' | 'REVIEW' | 'RELEARNING'
				step?: number | null
				inherited_stability?: number | null
				inherited_difficulty?: number | null
				inherited_state?: 'LEARNING' | 'REVIEW' | 'RELEARNING' | null
				inherited_step?: number | null
				inherited_last_review?: string | null
				srs_enabled?: boolean
			}
	  }

export type CreateRelationshipInput =
	| { parent: number; child: number }
	| {
			parent: number
			childData: Pick<
				Topic,
				| 'name'
				| 'notes'
				| 'archived'
				| 'inboxed'
				| 'stability'
				| 'difficulty'
				| 'state'
				| 'step'
				| 'inherited_stability'
				| 'inherited_difficulty'
				| 'inherited_state'
				| 'inherited_step'
				| 'inherited_last_review'
				| 'srs_enabled'
			>
	  }
	| {
			child: number
			parentData: Pick<
				Topic,
				| 'name'
				| 'notes'
				| 'archived'
				| 'inboxed'
				| 'stability'
				| 'difficulty'
				| 'state'
				| 'step'
				| 'inherited_stability'
				| 'inherited_difficulty'
				| 'inherited_state'
				| 'inherited_step'
				| 'inherited_last_review'
				| 'srs_enabled'
			>
	  }

export type DeleteChildRelationshipInput = {
	parentId: number
	childId: number
}

export type DeleteParentRelationshipInput = {
	childId: number
	parentId: number
}
