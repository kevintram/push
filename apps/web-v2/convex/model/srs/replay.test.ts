import { readFileSync } from 'node:fs'

import { Rating, State } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'

import {
	cardFromReviewSnapshot,
	emptyCard,
	fromSchedulerState,
	isoToJsDate,
	jsDateToIso,
	type LearningState,
	ratingToGrade,
	replay,
	type ReviewCardSrsState,
	type ReviewRating,
	type ReviewSrsPatch,
	toSchedulerState,
} from './replay'

interface ExpectedState {
	stability: number
	difficulty: number
	state: LearningState
	step: number | null
}

interface ExpectedPatch {
	stabilityAfter: number
	difficultyAfter: number
	stateAfter: LearningState
	stepAfter: number | null
	dueAfter: string
}

interface ParityCase {
	name: string
	reviews: Array<{ date: string; rating: ReviewRating }>
	expected: Array<ExpectedPatch>
	cardState: ExpectedState
}

const parityCases = JSON.parse(
	readFileSync(
		new URL('./fixtures/replay-scenarios.json', import.meta.url),
		'utf8',
	),
) as Array<ParityCase>

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
	expect(actual.dueAfter).toBe(expected.dueAfter)
}

function expectCardParity(
	actual: ReviewCardSrsState,
	expected: ExpectedState,
): void {
	expectNumberParity(actual.stability, expected.stability)
	expectNumberParity(actual.difficulty, expected.difficulty)
	expect(actual.state).toBe(expected.state)
	expect(actual.step ?? null).toBe(expected.step)
}

describe('SRS mappings', () => {
	it('maps every database rating to the corresponding FSRS grade', () => {
		expect(ratingToGrade('miss')).toBe(Rating.Again)
		expect(ratingToGrade('hard')).toBe(Rating.Hard)
		expect(ratingToGrade('good')).toBe(Rating.Good)
		expect(ratingToGrade('easy')).toBe(Rating.Easy)
	})

	it('maps every persisted learning state in both directions', () => {
		const pairs = [
			['LEARNING', State.Learning],
			['REVIEW', State.Review],
			['RELEARNING', State.Relearning],
		] as const

		for (const [persisted, schedulerState] of pairs) {
			expect(toSchedulerState(persisted)).toBe(schedulerState)
			expect(fromSchedulerState(schedulerState)).toBe(persisted)
		}
	})

	it('never permits the ts-fsrs New state to be persisted', () => {
		expect(() => fromSchedulerState(State.New)).toThrow(
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
	})
})

describe('SRS card construction', () => {
	it('creates a deterministic Learning card instead of a New card', () => {
		const card = emptyCard(isoToJsDate('2024-03-04'))

		expect(card.state).toBe(State.Learning)
		expect(card.due.toISOString()).toBe('2024-03-04T00:00:00.000Z')
		expect(card.last_review).toBeUndefined()
	})

	it('reconstructs a seed from its after snapshot without persisted bookkeeping', () => {
		const card = cardFromReviewSnapshot({
			date: '2024-03-04',
			difficultyAfter: 4.5,
			dueAfter: '2024-04-20',
			stabilityAfter: 12.5,
			stateAfter: 'REVIEW',
			stepAfter: 8,
		})

		expect(card).toMatchObject({
			difficulty: 4.5,
			learning_steps: 0,
			lapses: 0,
			reps: 0,
			stability: 12.5,
			state: State.Review,
		})
		expect(card.due.toISOString()).toBe('2024-03-04T00:00:00.000Z')
		expect(card.last_review?.toISOString()).toBe('2024-03-04T00:00:00.000Z')
	})
})

describe('SRS replay', () => {
	it.each(parityCases)(
		'matches the deterministic replay conformance scenario: $name',
		fixture => {
			const result = replay({ reviews: fixture.reviews })

			expect(result.reviewPatches).toHaveLength(fixture.expected.length)
			result.reviewPatches.forEach(({ patch }, index) => {
				expectPatchParity(patch, fixture.expected[index]!)
			})
			expectCardParity(result.cardState, fixture.cardState)
		},
	)

	it('returns a pristine persisted card state when there is no history', () => {
		expect(replay({ reviews: [] }).cardState).toEqual({
			difficulty: undefined,
			stability: undefined,
			state: 'LEARNING',
			step: undefined,
		})
	})

	it('records a complete deterministic before snapshot for the first review', () => {
		const first = replay({
			reviews: [{ date: '2024-06-15', rating: 'good' }],
		}).reviewPatches[0]!

		expect(first.patch).toMatchObject({
			difficultyBefore: undefined,
			dueBefore: '2024-06-15',
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
			{ date: '2024-01-01', rating: 'miss' },
			{ date: '2024-01-01', rating: 'hard' },
			{ date: '2024-01-01', rating: 'good' },
			{ date: '2024-01-01', rating: 'easy' },
		] as const

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
		const prefix = replay({ reviews: fixture.reviews.slice(0, 2) })
		const seedPatch = prefix.reviewPatches.at(-1)!.patch
		const suffix = replay({
			previousReview: {
				date: fixture.reviews[1]!.date,
				...seedPatch,
			},
			reviews: fixture.reviews.slice(2),
		})

		suffix.reviewPatches.forEach(({ patch }, index) => {
			expectPatchParity(patch, fixture.expected[index + 2]!)
		})
		expectCardParity(suffix.cardState, fixture.cardState)
	})

	it('ignores a seed without an after stability snapshot', () => {
		const reviews = [{ date: '2024-01-01', rating: 'easy' }] as const

		expect(
			replay({ previousReview: { date: '1999-01-01' }, reviews }),
		).toEqual(replay({ reviews }))
	})

	it('does not mutate review inputs', () => {
		const reviews = [
			{ date: '2024-01-01', marker: 'unchanged', rating: 'good' },
		] as const
		const original = structuredClone(reviews)

		const result = replay({ reviews })

		expect(reviews).toEqual(original)
		expect(result.reviewPatches[0]!.review).toBe(reviews[0])
	})
})
