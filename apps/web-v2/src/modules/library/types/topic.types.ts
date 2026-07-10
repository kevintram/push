import { type ReviewCard } from '~/modules/reviews/types/review.types'

export type Topic = {
	id: number
	parentId?: number
	title: string
	body: string
	reviewCards?: Array<ReviewCard>
}

export type TopicWithChildren = Topic & {
	children?: Array<TopicWithChildren>
}
