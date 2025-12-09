import type { Review } from '~/features/reviews/types/review.types'
import type { Topic } from '~/features/topics/types/topic.types'

export type ReviewSection = {
	id: string
	label: string
	headingClassName?: string
	entries: Array<Review>
}

export type TopicSection = {
	id: string
	label: string
	headingClassName?: string
	entries: Array<Topic>
}

export type MergedSection = {
	id: string
	label: string
	headingClassName?: string
	reviewsData?: ReviewSection
	topicsData?: TopicSection
}

export type MergeOptions = {
	sectionOrder?: Array<string>
	filterEmpty?: (section: MergedSection) => boolean
}
