import { convexTest } from 'convex-test'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { compareRanked, type Ranked } from '../shared/ordering'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import schema from './schema'
import { modules } from './test.setup'

const ownerId = 'user-a'

describe('migrations.backfillRanks', () => {
	it('ranks unranked sections and cards without changing any list order', async () => {
		const t = convexTest(schema, modules)
		const ids = await t.run(async ctx => {
			const collectionId = await ctx.db.insert('collections', {
				title: 'Collection',
				description: '',
				ownerId,
				path: [],
				searchText: 'Collection',
			})
			const insertSection = (title: string) =>
				ctx.db.insert('sections', { collectionId, ownerId, title })
			const insertCard = (
				primaryText: string,
				sectionId?: Id<'sections'>,
				rank?: string,
			) =>
				ctx.db.insert('cards', {
					collectionId,
					...(sectionId && { sectionId }),
					...(rank && { rank }),
					ownerId,
					type: 'practice',
					primaryText,
					secondaryText: '',
					notes: '',
					state: 'LEARNING',
					searchText: primaryText,
				})

			const first = await insertSection('First')
			const second = await insertSection('Second')
			return {
				collectionId,
				sections: [first, second],
				unsectioned: [await insertCard('u1'), await insertCard('u2')],
				// An already ranked card stays last; the unranked ones go above it.
				first: [
					await insertCard('f1', first),
					await insertCard('f2', first),
					await insertCard('f3', first, 'a0'),
				],
			}
		})

		await t.mutation(internal.migrations.backfillRanks, {})

		await t.run(async ctx => {
			const sections = await ctx.db.query('sections').collect()
			const cards = await ctx.db.query('cards').collect()
			expect([...sections, ...cards].every(row => row.rank)).toBe(true)

			const ordered = (rows: Array<Ranked>) =>
				[...rows].sort(compareRanked)
			expect(ordered(sections).map(row => row._id)).toEqual(ids.sections)
			expect(
				ordered(cards.filter(card => !card.sectionId)).map(
					card => card._id,
				),
			).toEqual(ids.unsectioned)
			expect(
				ordered(
					cards.filter(card => card.sectionId === ids.sections[0]),
				).map(card => card._id),
			).toEqual(ids.first)
		})
	})
})

describe('migrations.replayAllCardSrs', () => {
	afterEach(() => {
		vi.useRealTimers()
		vi.restoreAllMocks()
	})

	// Due dates are ts-fsrs at 90% retention; at 85% they would be
	// 2024-01-05 and 2024-01-25.
	it('reschedules every card under the current retention, across pages', async () => {
		vi.useFakeTimers()
		vi.spyOn(console, 'log').mockImplementation(() => {})
		const consoleError = vi
			.spyOn(console, 'error')
			.mockImplementation(() => {})
		const t = convexTest(schema, modules)
		const ids = await t.run(async ctx => {
			const collectionId = await ctx.db.insert('collections', {
				title: 'Collection',
				description: '',
				ownerId,
				path: [],
				searchText: 'Collection',
			})
			// Derived fields left over from an older retention target.
			const insertCard = (primaryText: string) =>
				ctx.db.insert('cards', {
					collectionId,
					ownerId,
					type: 'practice',
					primaryText,
					secondaryText: '',
					notes: '',
					state: 'REVIEW',
					step: undefined,
					dueDate: '2030-01-01',
					searchText: primaryText,
				})
			const insertReview = (
				cardId: Id<'cards'>,
				date: string,
				rating?: 'good' | 'hard',
			) =>
				ctx.db.insert('reviews', {
					ownerId,
					cardId,
					...(rating && { rating, dueDateAfter: '2030-01-01' }),
					date,
					description: '',
					notes: '',
				})

			// More than one page of reviewed cards.
			const reviewed: Array<Id<'cards'>> = []
			for (let index = 0; index < 12; index++) {
				const cardId = await insertCard(`reviewed ${index}`)
				await insertReview(cardId, '2024-01-01', 'good')
				await insertReview(cardId, '2024-01-05', 'hard')
				// A scheduled review that has not been completed yet.
				await insertReview(cardId, '2024-02-01')
				reviewed.push(cardId)
			}
			const broken = await insertCard('broken')
			await insertReview(broken, 'not-a-date', 'good')
			return {
				reviewed,
				broken,
				unreviewed: await insertCard('unreviewed'),
			}
		})

		await t.mutation(internal.migrations.replayAllCardSrs, {})
		await t.finishAllScheduledFunctions(vi.runAllTimers)

		await t.run(async ctx => {
			for (const cardId of ids.reviewed) {
				const card = await ctx.db.get('cards', cardId)
				expect(card).toMatchObject({
					dueDate: '2024-01-16',
					state: 'REVIEW',
					lastReview: { date: '2024-01-05', rating: 'hard' },
				})
				const reviews = await ctx.db
					.query('reviews')
					.withIndex('by_cardId_date', q => q.eq('cardId', cardId))
					.collect()
				expect(reviews.map(review => review.dueDateAfter)).toEqual([
					'2024-01-03',
					'2024-01-16',
					undefined,
				])
			}

			// A card that cannot replay is logged and left untouched.
			expect(await ctx.db.get('cards', ids.broken)).toMatchObject({
				dueDate: '2030-01-01',
			})
			expect(consoleError).toHaveBeenCalledWith(
				expect.stringContaining(ids.broken),
				expect.any(Error),
			)

			// A card without completed reviews is unscheduled.
			const unreviewed = await ctx.db.get('cards', ids.unreviewed)
			expect(unreviewed?.state).toBe('LEARNING')
			expect(unreviewed?.dueDate).toBeUndefined()
		})
	})
})
