import type { Id } from '@convex/_generated/dataModel'
import type { CardSearchResult as CardHit } from '@convex/validators/cards'
import type { CollectionSearchResult as CollectionHit } from '@convex/validators/collections'

type SearchResultBase = {
	pathText: string
	secondaryText: string
	title: string
}

export type SearchResultItem =
	| (SearchResultBase & { id: Id<'cards'>; kind: 'card' })
	| (SearchResultBase & { id: Id<'collections'>; kind: 'collection' })

const UNTITLED = 'Untitled'

function buildPathText(
	pathTitles: ReadonlyArray<string>,
	title: string,
): string {
	return [
		...pathTitles.map(pathTitle => pathTitle.trim() || UNTITLED),
		title,
	].join(' / ')
}

export function buildCollectionResults(
	collections: ReadonlyArray<CollectionHit>,
): Array<SearchResultItem> {
	return collections.map(collection => {
		const title = collection.title.trim() || UNTITLED
		return {
			id: collection._id,
			kind: 'collection',
			pathText: buildPathText(collection.pathTitles, title),
			secondaryText: collection.description.trim(),
			title,
		}
	})
}

export function buildCardResults(
	cards: ReadonlyArray<CardHit>,
	query: string,
): Array<SearchResultItem> {
	const normalizedQuery = query.trim().toLocaleLowerCase()

	return cards.map(card => {
		const title = card.primaryText.trim() || UNTITLED
		return {
			id: card._id,
			kind: 'card',
			pathText: buildPathText(card.pathTitles, title),
			secondaryText:
				normalizedQuery !== '' &&
				card.notes.toLocaleLowerCase().includes(normalizedQuery)
					? card.notes.trim()
					: card.secondaryText.trim(),
			title,
		}
	})
}
