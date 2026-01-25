export const EntityType = {
	Topic: 'topic',
	Source: 'source'
} as const

export type EntityType = (typeof EntityType)[keyof typeof EntityType]

export type EntityRelationCreate = {
	to_entity_type: EntityType
	to_entity_id: number
}

export type SourcePrerequisiteRead = {
	id: number
	source_id: number
	prereq_topic_id: number | null
	prereq_source_id: number | null
}

export type SourcePrerequisiteCreate = {
	prereq_entity_type: EntityType
	prereq_entity_id: number
}
