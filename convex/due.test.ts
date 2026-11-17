import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'

import { api } from './_generated/api'
import type { Id } from './_generated/dataModel'
import type * as Due from './model/due'
import schema from './schema'
import { modules } from './test.setup'

const userAIdentity = { subject: 'user-a' }
const userBIdentity = { subject: 'user-b' }

type Harness = ReturnType<typeof convexTest>

async function seedCollection(
	t: Harness,
	ownerId: string,
): Promise<Id<'collections'>> {
	return await t.run(
		async ctx =>
			await ctx.db.insert('collections', {
				description: '',
				ownerId,
				path: [],
				searchText: 'Collection',
				title: 'Collection',
			}),
	)
}

async function seedCard(
	t: Harness,
	collectionId: Id<'collections'>,
	ownerId: string,
	fields: { dueDate?: string; prompt: string; retiredAt?: number },
): Promise<Id<'cards'>> {
	return await t.run(
		async ctx =>
			await ctx.db.insert('cards', {
				notes: '',
				ownerId,
				answer: '',
				searchText: fields.prompt,
				state: 'LEARNING',
				collectionId,
				...fields,
			}),
	)
}

/** The cards as `dueDate` / `prompt` pairs, for order-sensitive asserts. */
async function list(
	t: Harness,
	userId: string,
	dueDate: Due.DueFilters['dueDate'],
): Promise<Array<string>> {
	const cards = await t
		.withIdentity({ subject: userId })
		.query(api.due.list, { dueDate })

	return cards.map(card => `${card.dueDate} ${card.prompt}`)
}

describe('due.list', () => {
	it('requires authentication', async () => {
		const t = convexTest(schema, modules)

		await expect(
			t.query(api.due.list, { dueDate: '2026-08-10' }),
		).rejects.toMatchObject({ data: "You've been signed out" })
	})

	it('returns only the cards due on the date', async () => {
		const t = convexTest(schema, modules)
		const collectionId = await seedCollection(t, userAIdentity.subject)
		for (const dueDate of ['2026-08-09', '2026-08-10', '2026-08-11']) {
			await seedCard(t, collectionId, userAIdentity.subject, {
				dueDate,
				prompt: `Due ${dueDate}`,
			})
		}

		await expect(
			list(t, userAIdentity.subject, '2026-08-10'),
		).resolves.toEqual(['2026-08-10 Due 2026-08-10'])
	})

	it("never returns another user's cards", async () => {
		const t = convexTest(schema, modules)
		const collectionId = await seedCollection(t, userBIdentity.subject)
		await seedCard(t, collectionId, userBIdentity.subject, {
			dueDate: '2026-08-10',
			prompt: "User B's card",
		})

		await expect(
			list(t, userAIdentity.subject, '2026-08-10'),
		).resolves.toEqual([])
	})

	it('rejects malformed dates', async () => {
		const t = convexTest(schema, modules)

		await expect(
			list(t, userAIdentity.subject, '2026-8-10'),
		).rejects.toThrow('Invalid date-only value')
	})

	it('rejects malformed and inverted ranges', async () => {
		const t = convexTest(schema, modules)

		await expect(
			list(t, userAIdentity.subject, {
				from: '2026-8-10',
				to: '2026-08-12',
			}),
		).rejects.toThrow('Invalid date-only value')

		await expect(
			list(t, userAIdentity.subject, {
				from: '2026-08-12',
				to: '2026-08-10',
			}),
		).rejects.toThrow('Invalid date range')
	})

	describe('date ranges', () => {
		async function seedThreeDays(t: Harness) {
			const collectionId = await seedCollection(t, userAIdentity.subject)
			for (const dueDate of ['2026-08-09', '2026-08-10', '2026-08-12']) {
				await seedCard(t, collectionId, userAIdentity.subject, {
					dueDate,
					prompt: `Due ${dueDate}`,
				})
			}
			return collectionId
		}

		it('covers `[from, to)` and excludes the end day', async () => {
			const t = convexTest(schema, modules)
			await seedThreeDays(t)

			await expect(
				list(t, userAIdentity.subject, {
					from: '2026-08-10',
					to: '2026-08-12',
				}),
			).resolves.toEqual(['2026-08-10 Due 2026-08-10'])
		})

		it('returns an empty range as no cards', async () => {
			const t = convexTest(schema, modules)
			await seedThreeDays(t)

			await expect(
				list(t, userAIdentity.subject, {
					from: '2026-08-10',
					to: '2026-08-10',
				}),
			).resolves.toEqual([])
		})

		it('supports a range with only a lower bound', async () => {
			const t = convexTest(schema, modules)
			await seedThreeDays(t)

			await expect(
				list(t, userAIdentity.subject, { from: '2026-08-10' }),
			).resolves.toEqual([
				'2026-08-12 Due 2026-08-12',
				'2026-08-10 Due 2026-08-10',
			])
		})

		it('supports a range with only an upper bound', async () => {
			const t = convexTest(schema, modules)
			await seedThreeDays(t)

			await expect(
				list(t, userAIdentity.subject, { to: '2026-08-10' }),
			).resolves.toEqual(['2026-08-09 Due 2026-08-09'])
		})

		it('supports a fully unbounded range and excludes undated cards', async () => {
			const t = convexTest(schema, modules)
			const collectionId = await seedThreeDays(t)
			await seedCard(t, collectionId, userAIdentity.subject, {
				prompt: 'Undated card',
			})

			await expect(list(t, userAIdentity.subject, {})).resolves.toEqual([
				'2026-08-12 Due 2026-08-12',
				'2026-08-10 Due 2026-08-10',
				'2026-08-09 Due 2026-08-09',
			])
		})

		it('sorts by due date, then by card creation order, newest first', async () => {
			const t = convexTest(schema, modules)
			const collectionId = await seedCollection(t, userAIdentity.subject)
			// Seeded out of date order to prove the sort does the work.
			await seedCard(t, collectionId, userAIdentity.subject, {
				dueDate: '2026-08-12',
				prompt: 'Later',
			})
			await seedCard(t, collectionId, userAIdentity.subject, {
				dueDate: '2026-08-10',
				prompt: 'First',
			})
			await seedCard(t, collectionId, userAIdentity.subject, {
				dueDate: '2026-08-10',
				prompt: 'Second',
			})

			await expect(
				list(t, userAIdentity.subject, {
					from: '2026-08-10',
					to: '2026-08-13',
				}),
			).resolves.toEqual([
				'2026-08-12 Later',
				'2026-08-10 Second',
				'2026-08-10 First',
			])
		})
	})

	describe('the dateless bucket', () => {
		it('returns only cards with no `dueDate`, newest first', async () => {
			const t = convexTest(schema, modules)
			const collectionId = await seedCollection(t, userAIdentity.subject)
			await seedCard(t, collectionId, userAIdentity.subject, {
				dueDate: '2026-08-10',
				prompt: 'Dated',
			})
			await seedCard(t, collectionId, userAIdentity.subject, {
				prompt: 'Older',
			})
			await seedCard(t, collectionId, userAIdentity.subject, {
				prompt: 'Newer',
			})

			await expect(list(t, userAIdentity.subject, null)).resolves.toEqual(
				['undefined Newer', 'undefined Older'],
			)
		})
	})

	it('excludes retired cards from a single day, a range, and `null`', async () => {
		const t = convexTest(schema, modules)
		const collectionId = await seedCollection(t, userAIdentity.subject)
		await seedCard(t, collectionId, userAIdentity.subject, {
			dueDate: '2026-08-10',
			prompt: 'Retired dated',
			retiredAt: 1_700_000_000_000,
		})
		await seedCard(t, collectionId, userAIdentity.subject, {
			prompt: 'Retired undated',
			retiredAt: 1_700_000_000_000,
		})

		await expect(
			list(t, userAIdentity.subject, '2026-08-10'),
		).resolves.toEqual([])
		await expect(list(t, userAIdentity.subject, {})).resolves.toEqual([])
		await expect(list(t, userAIdentity.subject, null)).resolves.toEqual([])
	})
})
