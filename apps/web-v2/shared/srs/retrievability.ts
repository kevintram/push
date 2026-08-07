import { DateTime } from 'luxon'

// Retrievability is the FSRS-6 estimate of the probability that a card can be
// recalled right now. It decays from one as time passes since the last review,
// at a rate set by the card's stability.
//
// All date calculations use UTC calendar days rather than elapsed 24-hour
// periods. Reviews and `today` are date-only strings, so treating them as
// instants would make results depend on the caller's time zone.

type OptionalValue<T> = T | null | undefined

// FSRS-6 models forgetting as R(t, S) = (1 + factor * t / S) ^ decay, where
// `t` is elapsed days and `S` is stability. The factor is derived from the
// decay exponent so that retrievability is exactly 90% when t equals S.
export const SRS_DECAY = -0.1542
export const SRS_FACTOR = 0.9 ** (1 / SRS_DECAY) - 1

/** Calculate the probability that a card can be recalled today. */
export function calculateRetrievability(
	stability: OptionalValue<number>,
	lastReviewedAt: OptionalValue<string>,
	today: string,
): number | null {
	// A card without a complete memory state has no meaningful position on
	// the forgetting curve. Keep that distinct from a known probability of 0.
	if (stability == null || lastReviewedAt == null) return null

	// Future review dates can occur through clock skew or imported data. They
	// represent a card with no elapsed forgetting time, not negative decay.
	const elapsedDays = Math.max(0, daysBetween(lastReviewedAt, today))
	if (elapsedDays === 0) return 1

	return (1 + (SRS_FACTOR * elapsedDays) / stability) ** SRS_DECAY
}

/** Calculate signed UTC calendar days from `start` to `end`. */
function daysBetween(start: string, end: string): number {
	const startDate = DateTime.fromISO(start, { zone: 'utc' })
	const endDate = DateTime.fromISO(end, { zone: 'utc' })
	return endDate.diff(startDate, 'days').days
}
