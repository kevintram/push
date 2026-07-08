export type ReviewCardStatus = 'due' | 'new' | 'late'

export type ReviewCard = {
	id: number
	status?: ReviewCardStatus
	title: string
	description?: string
}
