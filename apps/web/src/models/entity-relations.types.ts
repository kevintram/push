export const EntityType = {
	Topic: 'topic',
	Source: 'source'
} as const

export type EntityType = (typeof EntityType)[keyof typeof EntityType]

export type EntityRelationCreate = {
	to_entity_type: EntityType
	to_entity_id?: number
	to_topic?: {
		name: string
		notes: string
		archived: boolean
		inboxed: boolean
		srs_enabled?: boolean
		inherit_fsrs?: boolean
	}
	to_source?: {
		title: string
		notes: string
		archived: boolean
		inboxed: boolean
		srs_enabled?: boolean
		inherit_fsrs?: boolean
	}
}

export type RelatedEntity = {
	entity_type: EntityType
	id: number
	name: string | null // topic.name
	title: string | null // source.title
}

export type PrerequisiteTopicRead = {
	id: number
	name: string
}

export type PrerequisiteSourceRead = {
	id: number
	title: string
}

export type SourcePrerequisiteRead = {
	id: number
	source_id: number
	prereq_topic_id: number | null
	prereq_source_id: number | null
	prereq_topic: PrerequisiteTopicRead | null
	prereq_source: PrerequisiteSourceRead | null
}

export type SourcePrerequisiteCreate = {
	prereq_entity_type: EntityType
	prereq_entity_id?: number
	prereq_topic?: {
		name: string
		notes: string
		archived: boolean
		inboxed: boolean
		srs_enabled?: boolean
		inherit_fsrs?: boolean
	}
	prereq_source?: {
		title: string
		notes: string
		archived: boolean
		inboxed: boolean
		srs_enabled?: boolean
		inherit_fsrs?: boolean
	}
}
