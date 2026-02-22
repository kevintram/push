export type NoteTag = 'TOPIC' | 'SOURCE' | 'PRACTICE'
export type NoteRelationType =
	| 'RELATED'
	| 'PREREQUISITE'
	| 'COVERS'
	| 'ASSESSES'
export type NoteRelationDirection = 'outgoing' | 'incoming'
export type NoteReviewRating = 'miss' | 'hard' | 'good' | 'easy'
export type NoteStatusBadgeKey =
	| 'due'
	| 'hazy_soon'
	| 'forgotten_soon'
	| 'hazy_for'
	| 'forgotten_for'
export type NoteStatusBadgeTone = 'danger' | 'info' | 'neutral' | 'warning'

export interface NoteStatusBadge {
	key: NoteStatusBadgeKey
	label: string
	tooltip: string | null
	tone: NoteStatusBadgeTone
	review_id: number | null
}

export type ReadingStatus = 'NEW' | 'IN_PROGRESS' | 'ON_HOLD' | 'FINISHED'

export interface Note {
	id: number
	title: string
	body: string
	parent_id: number | null
	parent_title: string | null
	last_review_rating: NoteReviewRating | null
	fsrs_state_id: number | null
	reading_status: ReadingStatus
	reading_notes: string
	in_reading_list: boolean
	archived: boolean
	inboxed: boolean
	inserted_at: string
	updated_at: string
	stability: number | null
	difficulty: number | null
	state: string
	step: number | null
	srs_enabled: boolean
	last_reviewed_at: string | null
	retrievability: number | null
	freshness_tier: string | null
	days_until_next_tier: number | null
	days_in_current_tier: number | null
	tags: Array<NoteTag>
	status_badges: Array<NoteStatusBadge>
}

export interface GetNotesParams {
	inboxed?: boolean
	archived?: boolean
	root?: boolean
	parent_id?: number
	in_reading_list?: boolean
	reading_status?: ReadingStatus
	tag?: NoteTag
	limit?: number
	order?: 'asc' | 'desc'
}

export interface UpdateNoteInput {
	id: number
	title?: string
	body?: string
	parent_id?: number | null
	reading_status?: ReadingStatus
	reading_notes?: string
	in_reading_list?: boolean
	archived?: boolean
	inboxed?: boolean
	srs_enabled?: boolean
}

export interface NoteRelationListItem {
	id: number
	from_id: number
	to_id: number
	relation_type: NoteRelationType
	direction: NoteRelationDirection
	inserted_at: string
	updated_at: string
}
