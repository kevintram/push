import { type ReviewCard } from '~/modules/reviews/types/review.types'

export type Topic = {
	id: number
	slug: string
	title: string
	body: string
	reviewCards: Array<ReviewCard>
	children: Array<Topic>
}
