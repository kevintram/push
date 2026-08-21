import type { Id } from '@convex/_generated/dataModel'
import type { ReviewCardSearchResult } from '@convex/validators/reviewCards'
import type { TopicSearchResult } from '@convex/validators/topics'
import { describe, expect, it } from 'vitest'

import { buildCardResults, buildTopicResults } from '../searchResults'

const topicId = 'topic-1' as Id<'topics'>

const topic: TopicSearchResult = {
	_id: topicId,
	description: 'Foundations',
	pathTitles: ['Science'],
	title: 'Biology',
}

describe('searchResults', () => {
	it('builds topic and card labels', () => {
		const card: ReviewCardSearchResult = {
			_id: 'card-1' as Id<'reviewCards'>,
			notes: '',
			pathTitles: ['Science', 'Biology'],
			primaryText: 'What is mitosis?',
			secondaryText: 'Cell division',
		}

		expect(buildTopicResults([topic])).toMatchObject([
			{
				pathText: 'Library / Science / Biology',
				secondaryText: 'Foundations',
				title: 'Biology',
			},
		])
		expect(buildCardResults([card], 'mitosis')).toMatchObject([
			{
				pathText: 'Library / Science / Biology / What is mitosis?',
				secondaryText: 'Cell division',
				title: 'What is mitosis?',
			},
		])
	})

	it('shows notes when they explain why a card matched', () => {
		const card: ReviewCardSearchResult = {
			_id: 'card-notes' as Id<'reviewCards'>,
			notes: 'Compare cytokinesis after mitosis.',
			pathTitles: [],
			primaryText: 'Cell division detail',
			secondaryText: 'Unrelated answer',
		}

		expect(buildCardResults([card], 'cytokinesis')).toMatchObject([
			{ secondaryText: 'Compare cytokinesis after mitosis.' },
		])
	})

	it('renders Library / title for a root topic and Library / Root / Card for a root-topic card', () => {
		const rootTopic: TopicSearchResult = {
			_id: topicId,
			description: '',
			pathTitles: [],
			title: 'Root',
		}
		const rootCard: ReviewCardSearchResult = {
			_id: 'card-root' as Id<'reviewCards'>,
			notes: '',
			pathTitles: ['Root'],
			primaryText: 'Card',
			secondaryText: '',
		}

		expect(buildTopicResults([rootTopic])).toMatchObject([
			{ pathText: 'Library / Root' },
		])
		expect(buildCardResults([rootCard], '')).toMatchObject([
			{ pathText: 'Library / Root / Card' },
		])
	})

	it('falls back to Untitled for blank ancestor titles', () => {
		const card: ReviewCardSearchResult = {
			_id: 'card-blank' as Id<'reviewCards'>,
			notes: '',
			pathTitles: ['  ', 'Biology'],
			primaryText: 'Card',
			secondaryText: '',
		}

		expect(buildCardResults([card], '')).toMatchObject([
			{ pathText: 'Library / Untitled / Biology / Card' },
		])
	})
})
