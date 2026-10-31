import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'

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
