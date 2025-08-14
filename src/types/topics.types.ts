export interface Topic {
	id: string
	title: string
	notes: string
	created: Date
	stability: number // a number in days
	retrievability: number // a percentage
	children: Array<Topic>
	parents: Array<string>
	practicePrompts: Array<PracticePrompt>
	reviewHistory: Array<ReviewSession>
}

export type TopicWithParents = Topic & { parents: Array<Topic> }

export interface ReviewSession {
	date: Date
	retrievabilityBefore: number // a percentage
	stabilityBefore: number // a number in days
	stabilityAfter: number // a number in days
	practiceReviewed: Array<PracticePrompt>
}

export interface PracticePrompt {
	id: string
	title: string
}
