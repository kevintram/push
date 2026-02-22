import * as v from 'valibot'

export const NoteTagSchema = v.picklist(['TOPIC', 'SOURCE', 'PRACTICE'])
export const NoteRelationTypeSchema = v.picklist([
	'RELATED',
	'PREREQUISITE',
	'COVERS',
	'ASSESSES'
])
export const NoteRelationDirectionSchema = v.picklist(['outgoing', 'incoming'])
export const NoteReviewRatingSchema = v.picklist([
	'miss',
	'hard',
	'good',
	'easy'
])

export const ReadingStatusSchema = v.picklist([
	'NEW',
	'IN_PROGRESS',
	'ON_HOLD',
	'FINISHED'
])
export const NoteStatusBadgeKeySchema = v.picklist([
	'due',
	'hazy_soon',
	'forgotten_soon',
	'hazy_for',
	'forgotten_for'
])
export const NoteStatusBadgeToneSchema = v.picklist([
	'danger',
	'info',
	'neutral',
	'warning'
])
export const NoteStatusBadgeSchema = v.object({
	key: NoteStatusBadgeKeySchema,
	label: v.string(),
	tooltip: v.nullable(v.string()),
	tone: NoteStatusBadgeToneSchema,
	review_id: v.nullable(v.number())
})

export const NoteSchema = v.object({
	id: v.number(),
	title: v.string(),
	body: v.string(),
	parent_id: v.nullable(v.number()),
	parent_title: v.nullable(v.string()),
	last_review_rating: v.nullable(NoteReviewRatingSchema),
	fsrs_state_id: v.nullable(v.number()),
	reading_status: ReadingStatusSchema,
	reading_notes: v.string(),
	in_reading_list: v.boolean(),
	archived: v.boolean(),
	inboxed: v.boolean(),
	inserted_at: v.string(),
	updated_at: v.string(),
	stability: v.nullable(v.number()),
	difficulty: v.nullable(v.number()),
	state: v.string(),
	step: v.nullable(v.number()),
	srs_enabled: v.boolean(),
	last_reviewed_at: v.nullable(v.string()),
	retrievability: v.nullable(v.number()),
	freshness_tier: v.nullable(v.string()),
	days_until_next_tier: v.nullable(v.number()),
	days_in_current_tier: v.nullable(v.number()),
	tags: v.array(NoteTagSchema),
	status_badges: v.array(NoteStatusBadgeSchema)
})

export const NoteRelationListItemSchema = v.object({
	id: v.number(),
	from_id: v.number(),
	to_id: v.number(),
	relation_type: NoteRelationTypeSchema,
	direction: NoteRelationDirectionSchema,
	inserted_at: v.string(),
	updated_at: v.string()
})
