export interface Topic {
	id: string
	title: string
	notes: string
	created: Date
	stability: number
	retrievability: number
	children: Array<Topic>
	practicePrompts: Array<PracticePrompt>
	reviewHistory: Array<ReviewSession>
}

export type TopicWithParents = Topic & { parents: Array<Topic> }

export interface ReviewSession {
	date: Date
	retrievabilityBefore: number
	stabilityBefore: number
	stabilityAfter: number
	practiceReviewed: Array<PracticePrompt>
}

export interface PracticePrompt {
	id: string
	title: string
}