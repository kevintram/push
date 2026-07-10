type StaticReviewCard = {
	id: number
	primary_text: string
	secondary_text?: string
}

export type Topic = {
	id: number
	slug: string
	title: string
	body: string
	reviewCards: Array<StaticReviewCard>
	children: Array<Topic>
}
