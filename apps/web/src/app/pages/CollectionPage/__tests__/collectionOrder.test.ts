import type { Id } from '@convex/_generated/dataModel'
import type { Section } from '@convex/validators/sections'
import { describe, expect, it } from 'vitest'

import type { Card } from '~/modules/reviews/types/review.types'

import {
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
	it('moves within a list', () => {
		expect(planCardMove(grouped, cardId('a2'), 'up')).toEqual({
			sectionId: 'A',
			afterId: null,
		})
		expect(planCardMove(grouped, cardId('u1'), 'down')).toEqual({
			sectionId: null,
			afterId: 'u2',
		})
		expect(planCardMove(grouped, cardId('a2'), 'top')).toEqual({
			sectionId: 'A',
			afterId: null,
		})
		expect(planCardMove(grouped, cardId('u1'), 'bottom')).toEqual({
			sectionId: null,
			afterId: 'u2',
		})
	})

	it('crosses into the bottom of the list above from the top of a section', () => {
		expect(planCardMove(grouped, cardId('a1'), 'up')).toEqual({
			sectionId: null,
			afterId: 'u2',
		})
		expect(planCardMove(grouped, cardId('c1'), 'up')).toEqual({
			sectionId: 'B',
			afterId: null,
		})
	})

	it('crosses into the top of the list below from the bottom of a list', () => {
		expect(planCardMove(grouped, cardId('u2'), 'down')).toEqual({
			sectionId: 'A',
			afterId: null,
		})
	})

	it('stays put at the very top and bottom, and for top or bottom at an edge', () => {
		expect(planCardMove(grouped, cardId('u1'), 'up')).toBeNull()
		expect(planCardMove(grouped, cardId('c1'), 'down')).toBeNull()
		expect(planCardMove(grouped, cardId('a1'), 'top')).toBeNull()
		expect(planCardMove(grouped, cardId('a2'), 'bottom')).toBeNull()
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
