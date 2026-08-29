import { assertIsoDate } from '../../shared/date'
import { type Id } from '../_generated/dataModel'
import { type QueryCtx } from '../_generated/server'
import { type DueDateRange, type DueEntry } from '../validators/due'
import { toReview } from './reviews'

export type { DueDateRange, DueEntry } from '../validators/due'

/**
 * A single day's worth of work for a single card.
 *
 * A card lands in the queue for one of two independent reasons — its own SRS
 * `dueDate`, or an uncompleted review dated that day — and one entry captures
 * both, so a caller never sees the same `(date, card)` pair twice.
 */
/**
 * Lists the cards scheduled *on* `dueDate`, either by the card's own `dueDate`
 * or by an uncompleted review dated then.
 *
 * A card scheduled on several of the days yields one entry per day, so entries
 * are keyed by `(date, card)` rather than by card alone.
 *
 * @param dueDate a single day (isoDate), or a half-open range `[from, to)`.
 *   Either range bound may be omitted; an empty object covers all dates.
 * @returns one entry per day a card is due or has a scheduled review, sorted
 *   newest first by date, then by card creation time
 */
export async function list(
	ctx: QueryCtx,
	userId: string,
	dueDate: string | DueDateRange,
): Promise<Array<DueEntry>> {
	// validate `dueDate` param
	if (typeof dueDate === 'string') {
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

	const dueCardsQuery = ctx.db
		.query('cards')
		.withIndex('by_ownerId_dueDate', q => {
			const owned = q.eq('ownerId', userId)

			if (typeof dueDate === 'string') {
				return owned.eq('dueDate', dueDate)
			}

			if (dueDate.from !== undefined) {
				const lowerBounded = owned.gte('dueDate', dueDate.from)
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
		dueCardsQuery.collect(),
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

		cardsById.set(card._id, card)
	})

	// Add SRS-due cards first so reviews on the same day can merge into them.
	const entries = new Map<string, DueEntry>()
	function entryKey(date: string, cardId: Id<'cards'>): string {
		return `${date}|${cardId}`
	}

	for (const card of dueCards) {
		// `dueCards` came off the `dueDate` index, so `dueDate` is always set.
		// Narrowing only, not a real case.
		if (card.dueDate === undefined) continue

		entries.set(entryKey(card.dueDate, card._id), {
			card,
			date: card.dueDate,
			scheduledReviews: [],
			srsScheduled: true,
		})
	}

	// Fold each review directly into its `(date, card)` entry.
	for (const review of dueReviews) {
		// The index range is bounded by date strings, so a dateless review can
		// never match. Narrowing only, not a real case.
		if (review.date === undefined) continue

		const card = cardsById.get(review.cardId)

		// The card was deleted out from under its review (see the missing-card
		// load above). Skip; there is nothing to show without the card.
		if (card === undefined) continue

		const key = entryKey(review.date, review.cardId)
		const entry = entries.get(key)

		if (entry) {
			entry.scheduledReviews.push(review)
		} else {
			entries.set(key, {
				card,
				date: review.date,
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
			// Newest first, by date then card creation, so order is stable
			// across calls even when several cards share a day.
			.sort(
				(a, b) =>
					(a.date < b.date ? 1 : a.date > b.date ? -1 : 0) ||
					b.card._creationTime - a.card._creationTime,
			)
	)
}
