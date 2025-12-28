import dayjs from 'dayjs'

// FSRS constants (matching API)
const FSRS_DECAY = -0.1542
const FSRS_FACTOR = 0.9 ** (1 / FSRS_DECAY) - 1 // ~8.96

// Thresholds for categorization
export const LATE_THRESHOLD = 0.8 // Below 80% = late
export const ON_TIME_THRESHOLD = 0.95 // Below 95% = on time, above = early

export type RetrievabilityBucket = 'late' | 'onTime' | 'early'

/**
 * Categorize retrievability into buckets for display
 */
export function getRetrievabilityBucket(
	retrievability: number
): RetrievabilityBucket {
	if (retrievability >= ON_TIME_THRESHOLD) return 'early'
	if (retrievability >= LATE_THRESHOLD) return 'onTime'
	return 'late'
}

/**
 * Get Tailwind color class based on retrievability bucket
 */
export function getRetrievabilityColor(
	retrievability: number | null,
	srsEnabled = true
): string {
	if (!srsEnabled || retrievability === null) {
		return 'text-muted-foreground'
	}

	const bucket = getRetrievabilityBucket(retrievability)

	switch (bucket) {
		case 'early':
			return 'text-green-600 dark:text-green-400'
		case 'onTime':
			return 'text-blue-600 dark:text-blue-400'
		case 'late':
			return 'text-red-600 dark:text-red-400'
		default:
			return bucket satisfies never
	}
}

/**
 * Get background color class for bucket headers
 */
export function getRetrievabilityBucketBgColor(
	bucket: RetrievabilityBucket
): string {
	switch (bucket) {
		case 'early':
			return 'bg-green-50 dark:bg-green-950/30'
		case 'onTime':
			return 'bg-blue-50 dark:bg-blue-950/30'
		case 'late':
			return 'bg-red-50 dark:bg-red-950/30'
		default:
			return bucket satisfies never
	}
}

/**
 * Format retrievability as a percentage string
 */
export function formatRetrievability(retrievability: number | null): string {
	if (retrievability === null) return '—'
	return `${Math.round(retrievability * 100)}%`
}

/**
 * Calculate days until retrievability crosses a threshold.
 *
 * Formula derivation (solving for elapsed_days):
 * R = (1 + F * d / S)^D
 * R^(1/D) = 1 + F * d / S
 * (R^(1/D) - 1) * S / F = d
 *
 * Returns positive for future dates (days until threshold reached),
 * negative for past dates (days since threshold was crossed).
 */
export function calculateDaysToThreshold(
	stability: number,
	lastReviewedAt: string | null,
	targetRetrievability: number,
	currentDate?: string
): number {
	const current = currentDate ? dayjs(currentDate) : dayjs()
	const lastReview = lastReviewedAt ? dayjs(lastReviewedAt) : current

	// Days from lastReviewedAt when target retrievability is reached
	const targetDaysFromReview =
		(targetRetrievability ** (1 / FSRS_DECAY) - 1) * (stability / FSRS_FACTOR)

	const elapsedDays = current.diff(lastReview, 'day')

	return Math.round(targetDaysFromReview - elapsedDays)
}

/**
 * Get threshold crossing info for a topic.
 * Returns info about when the topic will move to the next bucket.
 */
export function getThresholdCrossingInfo(
	retrievability: number | null,
	stability: number | null,
	lastReviewedAt: string | null
): { daysUntil: number; nextBucket: RetrievabilityBucket } | null {
	if (retrievability === null || stability === null) {
		return null
	}

	const bucket = getRetrievabilityBucket(retrievability)

	// Late topics have no next bucket
	if (bucket === 'late') {
		return null
	}

	// Determine target threshold based on current bucket
	const targetThreshold =
		bucket === 'early' ? ON_TIME_THRESHOLD : LATE_THRESHOLD
	const nextBucket: RetrievabilityBucket =
		bucket === 'early' ? 'onTime' : 'late'

	const daysUntil = calculateDaysToThreshold(
		stability,
		lastReviewedAt,
		targetThreshold
	)

	return { daysUntil, nextBucket }
}

/**
 * Format threshold crossing info as display text
 */
export function formatThresholdCrossing(
	info: { daysUntil: number; nextBucket: RetrievabilityBucket } | null
): string | null {
	if (!info) return null

	const { daysUntil, nextBucket } = info

	if (daysUntil <= 0) {
		// Already past the threshold
		return null
	}

	const bucketLabel = nextBucket === 'onTime' ? 'ready' : 'late'
	return `${bucketLabel} in ${daysUntil}d`
}
