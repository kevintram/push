// Practice/exercise item
export interface PracticeItem {
	id: string
	title: string
}

// Review session record
export interface ReviewSession {
	date: Date
	retrievabilityAtTheTime: number // percentage (0-100)
	stabilityAtTheTime: number // stability at the time of review (deprecated - use stabilityBefore)
	stabilityBefore: number // stability before the review session
	stabilityAfter: number // stability after the review session
	practiceItemsReviewed: string[] // IDs of practice items reviewed in this session
}

// Core topic data structure
export interface Topic {
	id: string
	title: string
	subtitle: string
	notes: string // notes content for this topic
	createdAt: Date
	lastReviewedAt: Date | null
	stability: number // days stable (0-365+)
	retrievability: number // percentage (0-100)
	parentIds: string[] // Parent topic IDs for DAG structure
	childIds: string[] // Child topic IDs for efficient lookup
	practiceItems: PracticeItem[] // practice items associated with this topic
	reviewHistory: ReviewSession[]
	// Computed properties for UI (can be derived)
	parentTitles: string[]
	childTitles: string[]
	daysSinceLastReview: number
	daysSinceCreated: number
}

// Flat topic structure for efficient lookup and storage
export interface TopicMap {
	[id: string]: Topic
}