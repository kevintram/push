import { calculateRetrievability } from '@shared/srs/retrievability'

import type { DateString } from '~/types/date'

import type { Card, CardSrsState } from '../types/review.types'

/** Build the time-sensitive SRS metadata used by card views. */
export function deriveCardSrsState(
	card: Card,
	today: DateString,
): CardSrsState {
	const stability = card.stability ?? null
	const lastReviewedAt =
		(card.lastReview?.date as DateString | undefined) ?? null
	const lastRating = card.lastReview?.rating ?? null
	const nextDueAt = (card.dueDate as DateString | undefined) ?? null
	return {
		lastReviewedAt,
		lastRating,
		nextDueAt,
		retrievability: calculateRetrievability(
			stability,
			lastReviewedAt,
			today,
		),
		stability,
	}
}

const MAX_STRENGTH_DAYS = 365
const DAYS_PER_MONTH = 30
/** Days at which each strength bar fills: a week, a month, half a year, a year. */
const STRENGTH_LEVEL_DAYS = [7, 30, 180, 360]

/** Whole days of FSRS stability, floored and capped at a year. */
function strengthDays(stability: number): number {
	return Math.min(Math.floor(stability), MAX_STRENGTH_DAYS)
}

/** Split days into whole days under a month, then whole months. */
function splitDays(days: number): [count: number, unit: 'day' | 'month'] {
	return days < DAYS_PER_MONTH
		? [days, 'day']
		: [Math.floor(days / DAYS_PER_MONTH), 'month']
}

function formatDays(days: number): string {
	const [count, unit] = splitDays(days)
	return `${count}${unit === 'day' ? 'd' : 'mo'}`
}

function formatDaysLong(days: number): string {
	const [count, unit] = splitDays(days)
	return `${count} ${unit}${count === 1 ? '' : 's'}`
}

/** Number of filled strength bars, from 0 to 4. */
export function getStrengthLevel(stability: number): number {
	const days = strengthDays(stability)
	return STRENGTH_LEVEL_DAYS.filter(threshold => days >= threshold).length
}

/** Format FSRS stability as days under a month, then whole months. */
export function formatStrength(stability: number): string {
	return formatDays(strengthDays(stability))
}

/** Change in displayed strength days, or `null` without a previous strength. */
export function getStrengthDelta(
	stabilityBefore: number | null,
	stabilityAfter: number,
): number | null {
	if (stabilityBefore === null) return null
	return strengthDays(stabilityAfter) - strengthDays(stabilityBefore)
}

/** Format a strength change with its sign, such as `+8d` or `−2mo`, or `new`. */
export function formatStrengthDelta(delta: number | null): string {
	if (delta === null) return 'new'
	return `${delta < 0 ? '−' : '+'}${formatDays(Math.abs(delta))}`
}

/** Explain the memory duration represented by an FSRS stability value. */
export function formatStrengthTooltip(stability: number): string {
	return `Estimated to remember for ${formatDaysLong(strengthDays(stability))}`
}
