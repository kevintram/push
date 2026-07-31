import type { Doc } from '@convex/_generated/dataModel'

export type Topic = Doc<'topics'>

export type TopicWithChildren = Topic & {
	childTopics: Array<TopicWithChildren>
}
