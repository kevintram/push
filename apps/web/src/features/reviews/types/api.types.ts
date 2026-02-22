import type { Rating, ReviewListItem } from './review.types'

export type CreateReviewPayload = {
	note_id: number
	rating?: Rating | null
	description?: string
	notes?: string
	scheduled_at?: string | null
	completed_at?: string | null
}

export type UpdateReviewInput = {
	id: number
	rating?: Rating | null
	description?: string
	notes?: string
	scheduled_at?: string | null
	completed_at?: string | null
	note_id?: number
}

export type GetReviewsFilters = {
	noteId?: number
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
