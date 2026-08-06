// This module translates the continuous FSRS-6 forgetting curve into the
// discrete freshness language used by the product. Retrievability is a recall
// probability between zero and one. As that probability decays, a card moves
// through Fresh, Fine, Hazy, and finally Forgotten.
//
// All date calculations use UTC calendar days rather than elapsed 24-hour
// periods. Reviews and `today` are date-only strings, so treating them as
// instants would make results depend on the caller's time zone.

/** Product-facing labels derived from a card's current retrievability. */
export type FreshnessTier = 'Fresh' | 'Fine' | 'Hazy' | 'Forgotten'

type OptionalValue<T> = T | null | undefined

// FSRS-6 models forgetting as R(t, S) = (1 + factor * t / S) ^ decay, where
// `t` is elapsed days and `S` is stability. The factor is derived from the
// decay exponent so that retrievability is exactly 90% when t equals S.
export const SRS_DECAY = -0.1542
export const SRS_FACTOR = 0.9 ** (1 / SRS_DECAY) - 1

// These thresholds are the transition points between adjacent tiers. Exact
// equality intentionally belongs to the lower tier: 95% is Fine, 85% is Hazy,
// and 75% is Forgotten.
export const FRESH_THRESHOLD = 0.95
export const FINE_THRESHOLD = 0.85
export const HAZY_THRESHOLD = 0.75

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

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

/** Map a recall probability to its product-facing freshness label. */
export function getFreshnessTier(
	retrievability: OptionalValue<number>,
): FreshnessTier | null {
	if (retrievability == null) return null

	// Check upward from the lowest tier so each exact threshold falls into
	// the tier that the card has just entered.
	if (retrievability <= HAZY_THRESHOLD) return 'Forgotten'
	if (retrievability <= FINE_THRESHOLD) return 'Hazy'
	if (retrievability <= FRESH_THRESHOLD) return 'Fine'
	return 'Fresh'
}

/** Return the next threshold a card will cross as its recall decays. */
export function getNextTierThreshold(
	retrievability: OptionalValue<number>,
): number | null {
	const tier = getFreshnessTier(retrievability)
	if (tier === 'Fresh') return FRESH_THRESHOLD
	if (tier === 'Fine') return FINE_THRESHOLD
	if (tier === 'Hazy') return HAZY_THRESHOLD

	// Forgotten is the terminal tier, while null has no known tier. Neither
	// has another threshold to cross.
	return null
}

/** Return the threshold crossed when a card entered its current tier. */
export function getCurrentTierEntryThreshold(
	retrievability: OptionalValue<number>,
): number | null {
	const tier = getFreshnessTier(retrievability)
	if (tier === 'Fine') return FRESH_THRESHOLD
	if (tier === 'Hazy') return FINE_THRESHOLD
	if (tier === 'Forgotten') return HAZY_THRESHOLD

	// A Fresh card begins its tier at the review itself rather than at a
	// retrievability threshold. An unknown retrievability has no entry point.
	return null
}

/** Calculate whole calendar days elapsed within the current freshness tier. */
export function calculateDaysInCurrentTier(
	stability: OptionalValue<number>,
	lastReviewedAt: OptionalValue<string>,
	retrievability: OptionalValue<number>,
	today: string,
): number | null {
	if (stability == null || lastReviewedAt == null || retrievability == null) {
		return null
	}

	const entryThreshold = getCurrentTierEntryThreshold(retrievability)
	if (entryThreshold == null) {
		// Fresh has no prior threshold. Its age is therefore the number of days
		// since the review reset retrievability to one.
		return Math.max(0, daysBetween(lastReviewedAt, today))
	}

	// Once a threshold is behind us, the distance helper returns a negative
	// value. Negating it gives the number of whole days spent in this tier.
	return -computeDistanceToRetrievability(
		stability,
		lastReviewedAt,
		entryThreshold,
		today,
	)
}

/**
 * Calculate signed calendar days to a target recall probability.
 *
 * Positive values are days until the target; negative values are days since.
 * A missing review date treats today as the review date so callers can still
 * project forward from a known stability.
 */
export function computeDistanceToRetrievability(
	stability: number,
	lastReviewedAt: OptionalValue<string>,
	targetRetrievability: number,
	today: string,
): number {
	const reviewDate = lastReviewedAt ?? today

	// Invert the forgetting curve to find the fractional day on which the
	// target probability occurs, measured from the review date.
	const targetDaysFromReview =
		((targetRetrievability ** (1 / SRS_DECAY) - 1) * stability) / SRS_FACTOR
	const elapsedDays = daysBetween(reviewDate, today)
	const deltaDays = targetDaysFromReview - elapsedDays

	// Round away from zero so the integer result never understates the distance
	// to a future threshold or the time since a past one.
	if (deltaDays > 0) return Math.ceil(deltaDays)
	if (deltaDays < 0) return Math.floor(deltaDays)
	return 0
}

/** Convert a date-only ISO string into its UTC calendar-day number. */
function dateToEpochDay(value: string): number {
	return Math.floor(Date.parse(`${value}T00:00:00Z`) / MILLISECONDS_PER_DAY)
}

/** Calculate signed UTC calendar days from `start` to `end`. */
function daysBetween(start: string, end: string): number {
	return dateToEpochDay(end) - dateToEpochDay(start)
}
