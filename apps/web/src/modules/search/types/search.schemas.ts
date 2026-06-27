import * as v from 'valibot'

import { ReviewCardSchema } from '~/modules/review-cards/types/review-card.schemas'
import { TopicSchema } from '~/modules/topics/types/topic.schemas'

import { type SearchResultItem } from './search.types'

export const SearchResultItemSchema: v.GenericSchema<SearchResultItem> =
	v.object({
		entity_type: v.picklist(['topic', 'review_card']),
		topic: v.nullable(v.lazy(() => TopicSchema)),
		review_card: v.nullable(v.lazy(() => ReviewCardSchema)),
		recent_activity_at: v.string(),
	})
