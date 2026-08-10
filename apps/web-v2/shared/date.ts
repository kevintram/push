import { DateTime } from 'luxon'

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Assert that a value is a canonical ISO 8601 calendar date (YYYY-MM-DD). */
export function assertIsoDate(value: string): void {
	if (!ISO_DATE_PATTERN.test(value)) {
		throw new Error(`Invalid date-only value: ${value}`)
	}

	// Parse at UTC so validity never depends on the process timezone. Zones can
	// skip a whole calendar day (Pacific/Apia has no 2011-12-30), which would
	// otherwise make a perfectly good date string fail on some machines.
	const date = DateTime.fromISO(value, { zone: 'utc' })

	if (!date.isValid || date.toISODate() !== value) {
		throw new Error(`Invalid date-only value: ${value}`)
	}
}
