import type { Id } from '@convex/_generated/dataModel'
import type { Section } from '@convex/validators/sections'
import { describe, expect, it } from 'vitest'

import type { Card } from '~/modules/reviews/types/review.types'

import {
	type MoveDirection,
	planCardMove,
	planSectionMove,
	selectionOrder,
} from '../collectionOrder'
import type { GroupedCards } from '../groupCardsBySection'

const card = (id: string) => ({ _id: id as Id<'cards'> }) as Card
const section = (id: string) => ({ _id: id as Id<'sections'> }) as Section
const sectionId = (id: string) => id as Id<'sections'>
const cardId = (id: string) => id as Id<'cards'>

// u1 u2 | A: a1 a2 | B: (empty) | C: c1
const grouped: GroupedCards = {
	unsectioned: [card('u1'), card('u2')],
	sections: [
		{ section: section('A'), cards: [card('a1'), card('a2')] },
		{ section: section('B'), cards: [] },
		{ section: section('C'), cards: [card('c1')] },
	],
}

describe('selectionOrder', () => {
	it('lists unsectioned cards, then each section followed by its cards', () => {
		expect(
			selectionOrder(grouped).map(entry => `${entry.kind}:${entry.id}`),
		).toEqual([
			'card:u1',
			'card:u2',
			'section:A',
			'card:a1',
			'card:a2',
			'section:B',
			'section:C',
			'card:c1',
		])
	})
})

describe('planCardMove', () => {
	const plan = (ids: Array<string>, direction: MoveDirection) =>
		planCardMove(grouped, new Set(ids.map(cardId)), direction)

	it('moves within a list', () => {
		expect(plan(['a2'], 'up')).toEqual({
			cardIds: ['a2'],
			sectionId: 'A',
			afterId: null,
		})
		expect(plan(['u1'], 'down')).toEqual({
			cardIds: ['u1'],
			sectionId: null,
			afterId: 'u2',
		})
		expect(plan(['a2'], 'top')).toEqual({
			cardIds: ['a2'],
			sectionId: 'A',
			afterId: null,
		})
		expect(plan(['u1'], 'bottom')).toEqual({
			cardIds: ['u1'],
			sectionId: null,
			afterId: 'u2',
		})
	})

	it('crosses into the bottom of the list above from the top of a section', () => {
		expect(plan(['a1'], 'up')).toEqual({
			cardIds: ['a1'],
			sectionId: null,
			afterId: 'u2',
		})
		expect(plan(['c1'], 'up')).toEqual({
			cardIds: ['c1'],
			sectionId: 'B',
			afterId: null,
		})
	})

	it('crosses into the top of the list below from the bottom of a list', () => {
		expect(plan(['u2'], 'down')).toEqual({
			cardIds: ['u2'],
			sectionId: 'A',
			afterId: null,
		})
	})

	it('stays put at the very top and bottom, and for top or bottom at an edge', () => {
		expect(plan(['u1'], 'up')).toBeNull()
		expect(plan(['c1'], 'down')).toBeNull()
		expect(plan(['a1'], 'top')).toBeNull()
		expect(plan(['a2'], 'bottom')).toBeNull()
		expect(plan(['u1', 'u2'], 'top')).toBeNull()
	})

	it('moves several cards as one run in page order, from their outer edges', () => {
		// Up goes from the first card, so the run crosses into the list above.
		expect(plan(['a2', 'u2'], 'up')).toEqual({
			cardIds: ['u2', 'a2'],
			sectionId: null,
			afterId: null,
		})
		// Down goes from the last card, into the top of the next list.
		expect(plan(['u1', 'a2'], 'down')).toEqual({
			cardIds: ['u1', 'a2'],
			sectionId: 'B',
			afterId: null,
		})
		// Bottom gathers into the last card's list, after its other cards.
		expect(plan(['u1', 'a1'], 'bottom')).toEqual({
			cardIds: ['u1', 'a1'],
			sectionId: 'A',
			afterId: 'a2',
		})
	})

	it('gathers a scattered selection that has nowhere further to go', () => {
		expect(plan(['u1', 'a1'], 'top')).toEqual({
			cardIds: ['u1', 'a1'],
			sectionId: null,
			afterId: null,
		})
	})
})

describe('planSectionMove', () => {
	it('moves among sections and stays put at the edges', () => {
		expect(planSectionMove(grouped, sectionId('C'), 'up')).toEqual({
			afterId: 'A',
		})
		expect(planSectionMove(grouped, sectionId('B'), 'up')).toEqual({
			afterId: null,
		})
		expect(planSectionMove(grouped, sectionId('A'), 'down')).toEqual({
			afterId: 'B',
		})
		expect(planSectionMove(grouped, sectionId('B'), 'bottom')).toEqual({
			afterId: 'C',
		})
		expect(planSectionMove(grouped, sectionId('A'), 'up')).toBeNull()
		expect(planSectionMove(grouped, sectionId('C'), 'bottom')).toBeNull()
	})
})
