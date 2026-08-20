import type { Doc, Id } from '@convex/_generated/dataModel'
import { describe, expect, it } from 'vitest'

import { buildCardResults, buildTopicResults } from '../searchResults'

const topicId = 'topic-1' as Id<'topics'>

const topic: Doc<'topics'> = {
	_id: topicId,
	_creationTime: 0,
	description: 'Foundations',
	ownerId: 'user-1',
	searchText: 'Biology\nFoundations',
	title: 'Biology',
}

describe('searchResults', () => {
	it('builds topic and card labels', () => {
		const card: Doc<'reviewCards'> = {
			_id: 'card-1' as Id<'reviewCards'>,
			_creationTime: 2,
			notes: '',
			ownerId: 'user-1',
			primaryText: 'What is mitosis?',
			searchText: 'What is mitosis?\nCell division',
			secondaryText: 'Cell division',
			state: 'LEARNING',
			topicId,
			type: 'flashcard',
		}

		expect(buildTopicResults([topic])).toMatchObject([
			{ secondaryText: 'Foundations', title: 'Biology' },
		])
		expect(buildCardResults([card], 'mitosis')).toMatchObject([
			{ secondaryText: 'Cell division', title: 'What is mitosis?' },
		])
	})

	it('shows notes when they explain why a card matched', () => {
		const card: Doc<'reviewCards'> = {
			_id: 'card-notes' as Id<'reviewCards'>,
			_creationTime: 2,
			notes: 'Compare cytokinesis after mitosis.',
			ownerId: 'user-1',
			primaryText: 'Cell division detail',
			searchText:
				'Cell division detail\nUnrelated answer\nCompare cytokinesis after mitosis.',
			secondaryText: 'Unrelated answer',
			state: 'LEARNING',
			topicId,
			type: 'flashcard',
		}

		expect(buildCardResults([card], 'cytokinesis')).toMatchObject([
			{ secondaryText: 'Compare cytokinesis after mitosis.' },
		])
	})
})
