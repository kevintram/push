import * as v from 'valibot'
import { SourceSchemaBase } from '~/features/sources/types/source.schemas'
import { TopicSchemaBase } from '~/features/topics/types/topic.schemas'

export const EntityRelationsResponseSchema = v.object({
	outgoing: v.array(v.union([TopicSchemaBase, SourceSchemaBase])),
	incoming: v.array(v.union([TopicSchemaBase, SourceSchemaBase]))
})
