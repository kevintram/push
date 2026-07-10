import { type Rating, type ReviewListItem } from './review.types'

export type CreateReviewPayload = {
	reviewCardId: number
	rating?: Rating | null
	description?: string
	notes?: string
	scheduledAt?: string | null
	completedAt?: string | null
}

export type UpdateReviewInput = {
	id: number
	rating?: Rating | null
	description?: string
	notes?: string
	scheduledAt?: string | null
	completedAt?: string | null
	reviewCardId?: number
}

export type GetReviewsFilters = {
	reviewCardId?: number
	effectiveDateBefore?: string
	effectiveDateAfter?: string
	scheduled?: boolean
	completed?: boolean
	order?: 'asc' | 'desc'
}

export type TodaySectionKey = 'overdue' | 'today'

export type SectionDefinition = {
	id: TodaySectionKey
	label: string
	headingClassName?: string
	emptyMessage: string
}

export type SoonSectionKey = 'tomorrow' | 'nextSevenDays'

export type SoonSectionDefinition = {
	id: SoonSectionKey
	label: string
	headingClassName?: string
	emptyMessage: string
}

export type UnscheduledSectionDefinition = {
	id: 'unscheduled'
	label: string
	headingClassName?: string
	emptyMessage: string
}

export type FutureSection = {
	id: string
	label: string
	entries: Array<ReviewListItem>
}

export type LogbookSection = {
	id: string
	label: string
	entries: Array<ReviewListItem>
}

export type TodayEntrySection = {
	id: TodaySectionKey
	label: string
	headingClassName?: string
	emptyMessage: string
	entries: Array<ReviewListItem>
}

export type SoonEntrySection = {
	id: SoonSectionKey
	label: string
	headingClassName?: string
	emptyMessage: string
	entries: Array<ReviewListItem>
}

export type UnscheduledEntrySection = {
	id: 'unscheduled'
	label: string
	headingClassName?: string
	emptyMessage: string
	entries: Array<ReviewListItem>
}

export type FutureEntrySection = {
	id: string
	label: string
	entries: Array<ReviewListItem>
}

export type LogbookEntrySection = {
	id: string
	label: string
	entries: Array<ReviewListItem>
}
