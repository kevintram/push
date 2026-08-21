import type { Id } from '@convex/_generated/dataModel'
import type { ReviewCardSearchResult as ReviewCardHit } from '@convex/validators/reviewCards'
import type { TopicSearchResult as TopicHit } from '@convex/validators/topics'

type SearchResultBase = {
	pathText: string
	secondaryText: string
	title: string
}

export type SearchResultItem =
	| (SearchResultBase & { id: Id<'reviewCards'>; kind: 'card' })
	| (SearchResultBase & { id: Id<'topics'>; kind: 'topic' })

const UNTITLED = 'Untitled'

function buildPathText(
	pathTitles: ReadonlyArray<string>,
	title: string,
): string {
	return [
		'Library',
		...pathTitles.map(pathTitle => pathTitle.trim() || UNTITLED),
		title,
	].join(' / ')
}

export function buildTopicResults(
	topics: ReadonlyArray<TopicHit>,
): Array<SearchResultItem> {
	return topics.map(topic => {
		const title = topic.title.trim() || UNTITLED
		return {
			id: topic._id,
			kind: 'topic',
			pathText: buildPathText(topic.pathTitles, title),
			secondaryText: topic.description.trim(),
			title,
		}
	})
}

export function buildCardResults(
	reviewCards: ReadonlyArray<ReviewCardHit>,
	query: string,
): Array<SearchResultItem> {
	const normalizedQuery = query.trim().toLocaleLowerCase()

	return reviewCards.map(reviewCard => {
		const title = reviewCard.primaryText.trim() || UNTITLED
		return {
			id: reviewCard._id,
			kind: 'card',
			pathText: buildPathText(reviewCard.pathTitles, title),
			secondaryText:
				normalizedQuery !== '' &&
				reviewCard.notes.toLocaleLowerCase().includes(normalizedQuery)
					? reviewCard.notes.trim()
					: reviewCard.secondaryText.trim(),
			title,
		}
	})
}
