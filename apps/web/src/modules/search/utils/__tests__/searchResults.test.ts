import type { Id } from '@convex/_generated/dataModel'
import type { CardSearchResult } from '@convex/validators/cards'
import type { CollectionSearchResult } from '@convex/validators/collections'
import { describe, expect, it } from 'vitest'

import { buildCardResults, buildCollectionResults } from '../searchResults'

const collectionId = 'collection-1' as Id<'collections'>

const collection: CollectionSearchResult = {
	_id: collectionId,
	description: 'Foundations',
	pathTitles: ['Science'],
	title: 'Biology',
}

describe('searchResults', () => {
	it('builds collection and card labels', () => {
		const card: CardSearchResult = {
			_id: 'card-1' as Id<'cards'>,
			notes: '',
			pathTitles: ['Science', 'Biology'],
			primaryText: 'What is mitosis?',
			secondaryText: 'Cell division',
		}

		expect(buildCollectionResults([collection])).toMatchObject([
			{
				pathText: 'Science / Biology',
				secondaryText: 'Foundations',
				title: 'Biology',
			},
		])
		expect(buildCardResults([card], 'mitosis')).toMatchObject([
			{
				pathText: 'Science / Biology / What is mitosis?',
				secondaryText: 'Cell division',
				title: 'What is mitosis?',
			},
		])
	})

	it('shows notes when they explain why a card matched', () => {
		const card: CardSearchResult = {
			_id: 'card-notes' as Id<'cards'>,
			notes: 'Compare cytokinesis after mitosis.',
			pathTitles: [],
			primaryText: 'Cell division detail',
			secondaryText: 'Unrelated answer',
		}

		expect(buildCardResults([card], 'cytokinesis')).toMatchObject([
			{ secondaryText: 'Compare cytokinesis after mitosis.' },
		])
	})

	it('renders the title for a root collection and Root / Card for a root-collection card', () => {
		const rootCollection: CollectionSearchResult = {
			_id: collectionId,
			description: '',
			pathTitles: [],
			title: 'Root',
		}
		const rootCard: CardSearchResult = {
			_id: 'card-root' as Id<'cards'>,
			notes: '',
			pathTitles: ['Root'],
			primaryText: 'Card',
			secondaryText: '',
		}

		expect(buildCollectionResults([rootCollection])).toMatchObject([
			{ pathText: 'Root' },
		])
		expect(buildCardResults([rootCard], '')).toMatchObject([
			{ pathText: 'Root / Card' },
		])
	})

	it('falls back to Untitled for blank ancestor titles', () => {
		const card: CardSearchResult = {
			_id: 'card-blank' as Id<'cards'>,
			notes: '',
			pathTitles: ['  ', 'Biology'],
			primaryText: 'Card',
			secondaryText: '',
		}

		expect(buildCardResults([card], '')).toMatchObject([
			{ pathText: 'Untitled / Biology / Card' },
		])
	})
})
