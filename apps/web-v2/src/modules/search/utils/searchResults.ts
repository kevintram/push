import type { Doc, Id } from '@convex/_generated/dataModel'

type SearchResultBase = {
	secondaryText: string
	title: string
}

export type SearchResultItem =
	| (SearchResultBase & { id: Id<'reviewCards'>; kind: 'card' })
	| (SearchResultBase & { id: Id<'topics'>; kind: 'topic' })

const UNTITLED = 'Untitled'

export function buildTopicResults(
	topics: ReadonlyArray<Doc<'topics'>>,
): Array<SearchResultItem> {
	return topics.map(topic => ({
		id: topic._id,
		kind: 'topic',
		secondaryText: topic.description.trim(),
		title: topic.title.trim() || UNTITLED,
	}))
}

export function buildCardResults(
	reviewCards: ReadonlyArray<Doc<'reviewCards'>>,
	query: string,
): Array<SearchResultItem> {
	const normalizedQuery = query.trim().toLocaleLowerCase()

	return reviewCards.map(reviewCard => ({
		id: reviewCard._id,
		kind: 'card',
		secondaryText:
			normalizedQuery !== '' &&
			reviewCard.notes.toLocaleLowerCase().includes(normalizedQuery)
				? reviewCard.notes.trim()
				: reviewCard.secondaryText.trim(),
		title: reviewCard.primaryText.trim() || UNTITLED,
	}))
}
