import { assertIsoDate } from '../../shared/date'
import { type Id } from '../_generated/dataModel'
import { type QueryCtx } from '../_generated/server'
import { type DueEntry, type DueFilters } from '../validators/due'
import { toReview } from './reviews'

export type { DueDateRange, DueEntry, DueFilters } from '../validators/due'

/**
 * A queue row, keyed by `(date, card)`.
 *
 * A card lands in the queue for one of two independent reasons — its own SRS
 * `dueDate`, or an uncompleted review dated that day — and one entry captures
 * both, so a caller never sees the same `(date, card)` pair twice. An entry may
 * have no date at all: the `dueDate: null` bucket holds cards that have not
 * entered SRS, plus undated uncompleted reviews.
 */
/**
 * Lists the cards scheduled *on* `filters.dueDate`, either by the card's own
 * `dueDate` or by an uncompleted review dated then.
 *
 * A card scheduled on several of the days yields one entry per day, so entries
 * are keyed by `(date, card)` rather than by card alone. Retired cards are
 * excluded outright: neither their `dueDate` nor their scheduled reviews
 * contribute.
 *
 * @param filters.dueDate a single day (isoDate), a half-open range `[from, to)`
 *   (either bound may be omitted; an empty object covers all dates), or `null`
 *   for the dateless bucket.
 * @param filters.srsScheduled when omitted, every entry is returned; `true`
 *   keeps only SRS-scheduled entries, `false` keeps only review-only entries.
 * @returns one entry per day a card is due or has a scheduled review, sorted
 *   newest first by date, then by card creation time, with dateless entries last
 */
export async function list(
	ctx: QueryCtx,
	userId: string,
	filters: DueFilters,
): Promise<Array<DueEntry>> {
	const { dueDate, srsScheduled } = filters

	// validate `dueDate` param
	if (dueDate === null) {
		// the dateless bucket; nothing to validate
	} else if (typeof dueDate === 'string') {
		// must be single
		assertIsoDate(dueDate)
	} else {
		// must be range
		if (dueDate.from !== undefined) assertIsoDate(dueDate.from)
		if (dueDate.to !== undefined) assertIsoDate(dueDate.to)

		if (
			dueDate.from !== undefined &&
			dueDate.to !== undefined &&
			dueDate.from > dueDate.to
		) {
			throw new Error(
				`Invalid date range: ${dueDate.from} is after ${dueDate.to}`,
			)
		}
	}

	// The two sources of dueness, each answered by its own index:
	//   1. Cards whose SRS `dueDate` falls in range.
	//   2. Uncompleted reviews (`rating` unset) whose `date` falls in range.

	// `srsScheduled: false` asks for review-only entries, and whether a review
	// is SRS-scheduled is decidable from its own card doc, so the card-side
	// query has no surviving output to contribute. Skip it.
	const dueCardsQuery =
		srsScheduled === false
			? undefined
			: ctx.db
					.query('cards')
					.withIndex('by_ownerId_retiredAt_dueDate', q => {
						// A retired card is out of the queue entirely, and the
						// index excludes it without a post-filter.
						const owned = q
							.eq('ownerId', userId)
							.eq('retiredAt', undefined)

						if (dueDate === null) {
							return owned.eq('dueDate', undefined)
						}

						if (typeof dueDate === 'string') {
							return owned.eq('dueDate', dueDate)
						}

						if (dueDate.from !== undefined) {
							const lowerBounded = owned.gte(
								'dueDate',
								dueDate.from,
							)
							return dueDate.to === undefined
								? lowerBounded
								: lowerBounded.lt('dueDate', dueDate.to)
						}

						const dated = owned.gt('dueDate', undefined)
						return dueDate.to === undefined
							? dated
							: dated.lt('dueDate', dueDate.to)
					})

	const dueReviewsQuery = ctx.db
		.query('reviews')
		.withIndex('by_ownerId_rating_date', q => {
			const owned = q.eq('ownerId', userId).eq('rating', undefined)

			if (dueDate === null) {
				return owned.eq('date', undefined)
			}

			if (typeof dueDate === 'string') {
				return owned.eq('date', dueDate)
			}

			if (dueDate.from !== undefined) {
				const lowerBounded = owned.gte('date', dueDate.from)
				return dueDate.to === undefined
					? lowerBounded
					: lowerBounded.lt('date', dueDate.to)
			}

			const dated = owned.gt('date', undefined)
			return dueDate.to === undefined
				? dated
				: dated.lt('date', dueDate.to)
		})

	// The queries are independent, so issue them concurrently.
	const [dueCards, dueReviewRows] = await Promise.all([
		// TODO(2): stop using unbounded `collect()`?
		dueCardsQuery?.collect() ?? [],
		dueReviewsQuery.collect(),
	])
	const dueReviews = dueReviewRows.map(toReview)

	const cardsById = new Map(dueCards.map(card => [card._id, card]))

	// Make sure we have all cards for all the dueReviews.
	//
	// missingCardIds = the ids of the cards we need to get
	const missingCardIds = new Set( // Use set to dedupe to save fetching the same card twice.
		dueReviews
			.map(review => review.cardId)
			.filter(id => !cardsById.has(id)),
	)
	const missingCards = await Promise.all(
		[...missingCardIds].map(id => ctx.db.get('cards', id)), // skip ownership check
	)

	missingCards.forEach(card => {
		// Add missing cards to `cardById`.

		// Skip nulls.
		// - A null here means the card was deleted out from under its review.
		//   Card deletion cascades to reviews, so this should not happen; drop
		//   the orphan rather than fail the whole query if this happens for
		//   whatever reason.
		if (card == null) return

		// The reviews index cannot express retirement, so drop retired cards
		// here. Leaving them out of the map drops their reviews below.
		if (card.retiredAt !== undefined) return

		cardsById.set(card._id, card)
	})

	// Add SRS-due cards first so reviews on the same day can merge into them.
	const entries = new Map<string, DueEntry>()
	function entryKey(date: string | undefined, cardId: Id<'cards'>): string {
		return `${date ?? ''}|${cardId}`
	}

	for (const card of dueCards) {
		entries.set(entryKey(card.dueDate, card._id), {
			card,
			// Absent for the `dueDate: null` bucket, where the card has not
			// entered SRS and so has no day to report.
			...(card.dueDate !== undefined && { date: card.dueDate }),
			scheduledReviews: [],
			srsScheduled: true,
		})
	}

	// Fold each review directly into its `(date, card)` entry.
	for (const review of dueReviews) {
		const card = cardsById.get(review.cardId)

		// The card was deleted out from under its review (see the missing-card
		// load above), or the card is retired. Skip; neither belongs in the queue.
		if (card === undefined) continue

		const key = entryKey(review.date, review.cardId)
		const entry = entries.get(key)

		if (entry) {
			entry.scheduledReviews.push(review)
		} else {
			entries.set(key, {
				card,
				...(review.date !== undefined && { date: review.date }),
				scheduledReviews: [review],
				srsScheduled: card.dueDate === review.date,
			})
		}
	}

	for (const entry of entries.values()) {
		// sort to keep stable
		entry.scheduledReviews.sort((a, b) => b._creationTime - a._creationTime)
	}

	return (
		[...entries.values()]
			// `srsScheduled` filters which entries exist, not what they carry:
			// a surviving entry still reports its `scheduledReviews`.
			.filter(
				entry =>
					srsScheduled === undefined ||
					entry.srsScheduled === srsScheduled,
			)
			// Newest first, by date then card creation, so order is stable
			// across calls even when several cards share a day. Dateless
			// entries have no day to rank by, so they sort last.
			.sort(
				(a, b) =>
					compareDatesDescending(a.date, b.date) ||
					b.card._creationTime - a.card._creationTime,
			)
	)
}

/**
 * Newest date first, with dateless entries after every dated one.
 *
 * A single call never mixes the two: a dated `dueDate` matches only dated cards
 * and dated reviews, and `null` matches only undated ones. The dateless branches
 * are a total-ordering guard, not a live case.
 */
function compareDatesDescending(
	a: string | undefined,
	b: string | undefined,
): number {
	if (a === b) return 0
	if (a === undefined) return 1
	if (b === undefined) return -1

	return a < b ? 1 : -1
}
