import type { Id } from '@convex/_generated/dataModel'
import type { Section } from '@convex/validators/sections'
import { describe, expect, it } from 'vitest'

import type { Card } from '~/modules/reviews/types/review.types'

import { groupCardsBySection } from '../groupCardsBySection'

function section(id: string): Section {
	return { _id: id as Id<'sections'>, title: id } as Section
}

function card(id: string, sectionId?: string): Card {
	return {
		_id: id as Id<'cards'>,
		sectionId: sectionId as Id<'sections'> | undefined,
	} as Card
}

function ids(cards: ReadonlyArray<Card>) {
	return cards.map(entry => entry._id)
}

describe('groupCardsBySection', () => {
	it('groups cards under their sections and keeps both input orders', () => {
		const grouped = groupCardsBySection(
			[section('anatomy'), section('processes')],
			[
				card('a', 'processes'),
				card('b'),
				card('c', 'anatomy'),
				card('d', 'processes'),
				card('e'),
			],
		)

		expect(ids(grouped.unsectioned)).toEqual(['b', 'e'])
		expect(
			grouped.sections.map(group => ({
				section: group.section._id,
				cards: ids(group.cards),
			})),
		).toEqual([
			{ section: 'anatomy', cards: ['c'] },
			{ section: 'processes', cards: ['a', 'd'] },
		])
	})

	it('keeps empty sections', () => {
		const grouped = groupCardsBySection([section('empty')], [card('a')])

		expect(grouped.sections).toEqual([
			{ section: section('empty'), cards: [] },
		])
		expect(ids(grouped.unsectioned)).toEqual(['a'])
	})

	it('treats a card whose section is not listed as unsectioned', () => {
		const grouped = groupCardsBySection([], [card('a', 'missing')])

		expect(ids(grouped.unsectioned)).toEqual(['a'])
		expect(grouped.sections).toEqual([])
	})

	it('orders sections and each group of cards by rank, unranked first', () => {
		const ranked = <T extends Section | Card>(
			entry: T,
			rank: string | undefined,
			_creationTime: number,
		): T => ({ ...entry, rank, _creationTime })

		const grouped = groupCardsBySection(
			[
				ranked(section('second'), 'a1', 1),
				ranked(section('first'), 'a0', 2),
			],
			[
				ranked(card('late'), 'a1', 1),
				ranked(card('early'), 'a0', 2),
				ranked(card('legacy'), undefined, 3),
				ranked(card('only', 'second'), 'a0', 4),
			],
		)

		expect(grouped.sections.map(group => group.section._id)).toEqual([
			'first',
			'second',
		])
		expect(ids(grouped.unsectioned)).toEqual(['legacy', 'early', 'late'])
	})
})
