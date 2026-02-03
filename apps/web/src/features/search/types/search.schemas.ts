import * as v from 'valibot'
import { PracticeSchemaBase } from '~/features/practices/types/practice.schemas'
import { SourceSchemaBase } from '~/features/sources/types/source.schemas'
import { TopicSchemaBase } from '~/features/topics/types/topic.schemas'
import type { SearchResultItem } from './search.types'

export const SearchResultItemSchema: v.GenericSchema<SearchResultItem> =
	v.union([
		v.object({
			entity_type: v.literal('topic'),
			topic: v.lazy(() => TopicSchemaBase),
			source: v.nullable(v.any()),
			practice: v.nullable(v.any()),
			recent_activity_at: v.string()
		}),
		v.object({
			entity_type: v.literal('source'),
			topic: v.nullable(v.any()),
			source: v.lazy(() => SourceSchemaBase),
			practice: v.nullable(v.any()),
			recent_activity_at: v.string()
		}),
		v.object({
			entity_type: v.literal('practice'),
			topic: v.nullable(v.any()),
			source: v.nullable(v.any()),
			practice: v.lazy(() => PracticeSchemaBase),
			recent_activity_at: v.string()
		})
	])
