export type ReviewCardStatus = 'due' | 'new' | 'late'

export type ReviewCard = {
	id: number
	status?: ReviewCardStatus
	primary_text: string
	secondary_text?: string
}
