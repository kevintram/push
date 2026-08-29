import { readFileSync } from 'node:fs'

import { Rating, State } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'

import type { Id } from '../../_generated/dataModel'
import type { Card } from '../../validators/cards'
import type { Review } from '../../validators/reviews'
import {
	type CardSrsState,
	cardSrsStateToFsrsCard,
	cardStateToFsrsState,
	fsrsStateToCardState,
	isoToJsDate,
	jsDateToIso,
	replay,
	reviewRatingToFsrsGrade,
	type ReviewSrsPatch,
} from './replay'

interface ExpectedState {
	stability: number
	difficulty: number
	state: Card['state']
	step: number | null
}

interface ExpectedPatch {
	stabilityAfter: number
	difficultyAfter: number
	stateAfter: Card['state']
	stepAfter: number | null
	dueDateAfter: string
}

interface ParityCase {
	name: string
	reviews: Array<{
		date: string
		rating: NonNullable<Review['rating']>
	}>
	expected: Array<ExpectedPatch>
	cardState: ExpectedState
}

const parityCases = JSON.parse(
	readFileSync(
		new URL('./fixtures/replay-scenarios.json', import.meta.url),
		'utf8',
	),
) as Array<ParityCase>

function makeReview(overrides: Partial<Review> = {}): Review {
	return {
		_id: 'review-id' as Id<'reviews'>,
		_creationTime: 0,
		ownerId: 'user-id',
		cardId: 'card-id' as Id<'cards'>,
		description: '',
		notes: '',
		...overrides,
	}
}

function expectNumberParity(
	actual: number | undefined,
	expected: number,
): void {
	expect(actual).toBeTypeOf('number')
	// ts-fsrs rounds memory-state inputs to eight decimal places between
	// reviews; py-fsrs retains the full binary float. Assert the libraries stay
	// within five millionths rather than relying on decimal-place rounding.
	expect(Math.abs(actual! - expected)).toBeLessThan(5e-6)
}

function expectPatchParity(
	actual: ReviewSrsPatch,
	expected: ExpectedPatch,
): void {
	expectNumberParity(actual.stabilityAfter, expected.stabilityAfter)
	expectNumberParity(actual.difficultyAfter, expected.difficultyAfter)
	expect(actual.stateAfter).toBe(expected.stateAfter)
	expect(actual.stepAfter ?? null).toBe(expected.stepAfter)
	expect(actual.dueDateAfter).toBe(expected.dueDateAfter)
}

function expectCardParity(actual: CardSrsState, expected: ExpectedState): void {
	expectNumberParity(actual.stability, expected.stability)
	expectNumberParity(actual.difficulty, expected.difficulty)
	expect(actual.state).toBe(expected.state)
	expect(actual.step ?? null).toBe(expected.step)
}

describe('SRS mappings', () => {
	it('maps every database rating to the corresponding FSRS grade', () => {
		expect(reviewRatingToFsrsGrade('miss')).toBe(Rating.Again)
		expect(reviewRatingToFsrsGrade('hard')).toBe(Rating.Hard)
		expect(reviewRatingToFsrsGrade('good')).toBe(Rating.Good)
		expect(reviewRatingToFsrsGrade('easy')).toBe(Rating.Easy)
	})

	it('maps every persisted learning state in both directions', () => {
		const pairs = [
			['LEARNING', State.Learning],
			['REVIEW', State.Review],
			['RELEARNING', State.Relearning],
		] as const

		for (const [persisted, schedulerState] of pairs) {
			expect(cardStateToFsrsState(persisted)).toBe(schedulerState)
			expect(fsrsStateToCardState(schedulerState)).toBe(persisted)
		}
	})

	it('never permits the ts-fsrs New state to be persisted', () => {
		expect(() => fsrsStateToCardState(State.New)).toThrow(
			'A new scheduler state cannot be persisted',
		)
	})

	it('lifts and lowers date-only strings at UTC midnight', () => {
		const date = isoToJsDate('2024-02-29')

		expect(date.toISOString()).toBe('2024-02-29T00:00:00.000Z')
		expect(jsDateToIso(date)).toBe('2024-02-29')
		expect(() => isoToJsDate('2024-02-30')).toThrow(
			'Invalid date-only value',
		)
		expect(() => isoToJsDate('2024-2-9')).toThrow('Invalid date-only value')
		expect(() => isoToJsDate('2024-02-29T00:00:00Z')).toThrow(
			'Invalid date-only value',
		)
	})
})

describe('SRS card construction', () => {
	it('reconstructs a seed from its after snapshot without persisted bookkeeping', () => {
		const card = cardSrsStateToFsrsCard({
			difficulty: 4.5,
			dueDate: '2024-04-20',
			lastReviewDate: '2024-03-04',
			stability: 12.5,
			state: 'REVIEW',
			step: 8,
		})

		expect(card).toMatchObject({
			difficulty: 4.5,
			learning_steps: 0,
			lapses: 0,
			reps: 0,
			stability: 12.5,
			state: State.Review,
		})
		expect(card.due.toISOString()).toBe('2024-04-20T00:00:00.000Z')
		expect(card.last_review?.toISOString()).toBe('2024-03-04T00:00:00.000Z')
	})
})

describe('SRS replay', () => {
	it.each(parityCases)(
		'matches the deterministic replay conformance scenario: $name',
		fixture => {
			const result = replay({ reviews: fixture.reviews.map(makeReview) })

			expect(result.reviewPatches).toHaveLength(fixture.expected.length)
			result.reviewPatches.forEach(({ patch }, index) => {
				expectPatchParity(patch, fixture.expected[index]!)
			})
			expectCardParity(result.cardState, fixture.cardState)
			expect(result.cardState.dueDate).toBe(
				fixture.expected.at(-1)!.dueDateAfter,
			)
			expect(result.cardState.lastReviewDate).toBe(
				fixture.reviews.at(-1)!.date,
			)
		},
	)

	it('returns the initial learning step when there is no history', () => {
		expect(replay({ reviews: [] }).cardState).toEqual({
			difficulty: undefined,
			dueDate: '1970-01-01',
			lastReviewDate: undefined,
			stability: undefined,
			state: 'LEARNING',
			step: 0,
		})
	})

	it('records a complete deterministic before snapshot for the first review', () => {
		const first = replay({
			reviews: [makeReview({ date: '2024-06-15', rating: 'good' })],
		}).reviewPatches[0]!

		expect(first.patch).toMatchObject({
			difficultyBefore: undefined,
			dueDateBefore: '2024-06-15',
			stabilityBefore: undefined,
			stateBefore: 'LEARNING',
			stepBefore: 0,
		})
	})

	it('replays same-day learning steps deterministically in input order', () => {
		// py-fsrs 6.3 and ts-fsrs 5.4.1 differ in their same-timestamp
		// short-term stability update. The product decision is to use ts-fsrs,
		// so keep this edge case deterministic without calling it cross-library
		// parity.
		const reviews = [
			makeReview({ date: '2024-01-01', rating: 'miss' }),
			makeReview({ date: '2024-01-01', rating: 'hard' }),
			makeReview({ date: '2024-01-01', rating: 'good' }),
			makeReview({ date: '2024-01-01', rating: 'easy' }),
		]

		const first = replay({ reviews })
		const second = replay({ reviews })

		expect(first).toEqual(second)
		expect(first.reviewPatches.map(({ review }) => review.rating)).toEqual([
			'miss',
			'hard',
			'good',
			'easy',
		])
		expect(first.cardState.state).toBe('REVIEW')
	})

	it('uses a prior after snapshot as the seed for suffix replay', () => {
		const fixture = parityCases.find(
			candidate => candidate.name === 'lapse_and_relearn',
		)!
		const prefix = replay({
			reviews: fixture.reviews.slice(0, 2).map(makeReview),
		})
		const seedPatch = prefix.reviewPatches.at(-1)!.patch
		const suffix = replay({
			previousReview: makeReview({
				date: fixture.reviews[1]!.date,
				...seedPatch,
			}),
			reviews: fixture.reviews.slice(2).map(makeReview),
		})

		suffix.reviewPatches.forEach(({ patch }, index) => {
			expectPatchParity(patch, fixture.expected[index + 2]!)
		})
		expectCardParity(suffix.cardState, fixture.cardState)
	})

	it('ignores a seed without an after stability snapshot', () => {
		const reviews = [makeReview({ date: '2024-01-01', rating: 'easy' })]

		expect(
			replay({
				previousReview: makeReview({ date: '1999-01-01' }),
				reviews,
			}),
		).toEqual(replay({ reviews }))
	})

	it('does not mutate review inputs', () => {
		const reviews = [makeReview({ date: '2024-01-01', rating: 'good' })]
		const original = structuredClone(reviews)

		const result = replay({ reviews })

		expect(reviews).toEqual(original)
		expect(result.reviewPatches[0]!.review).toBe(reviews[0])
	})
})
