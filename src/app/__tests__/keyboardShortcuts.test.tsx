import type { Doc, Id } from '@convex/_generated/dataModel'
import type { Card } from '@convex/validators/cards'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConvexReactClient } from 'convex/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { card, cardId, collectionId, renderRoute } from './renderRoute'

vi.mock('@clerk/react', () => ({
	SignInButton: ({ children }: { children: ReactNode }) => children,
	useClerk: () => ({ signOut: vi.fn() }),
	useUser: () => ({
		isLoaded: true,
		isSignedIn: true,
		user: {
			fullName: 'Test User',
			primaryEmailAddress: { emailAddress: 'test@example.com' },
		},
	}),
}))

// Keep Convex's data provider real while rendering the auth gate as signed in.
vi.mock('convex/react', async importOriginal => ({
	...(await importOriginal<typeof import('convex/react')>()),
	Authenticated: ({ children }: { children: ReactNode }) => children,
	AuthLoading: () => null,
	Unauthenticated: () => null,
	useConvexAuth: () => ({
		isAuthenticated: true,
		isLoading: false,
		isRefreshing: false,
	}),
}))

const secondCard: Card = {
	...card,
	_id: 'card-2' as Id<'cards'>,
	primaryText: 'What is a discriminated union?',
}

function spyOnMutations(result: unknown = null) {
	return vi
		.spyOn(ConvexReactClient.prototype, 'mutation')
		.mockResolvedValue(result)
}

/** The arguments of the most recent Convex mutation. */
function lastMutationArgs(mutation: ReturnType<typeof spyOnMutations>) {
	return mutation.mock.calls.at(-1)?.[1]
}

describe('keyboard shortcuts', () => {
	beforeEach(() => {
		window.localStorage.clear()
		window.sessionStorage.clear()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('goes to a review queue with G then its key, without the key’s own shortcut', async () => {
		const user = userEvent.setup()
		const mutation = spyOnMutations()
		const { router } = renderRoute('/review/new', { newCards: [card] })
		await screen.findByDisplayValue(card.primaryText)

		// F alone flags the open card, but as the end of `G F` it only navigates.
		await user.keyboard('gf')
		await waitFor(() =>
			expect(router.state.location.pathname).toBe('/review/flagged'),
		)
		expect(mutation).not.toHaveBeenCalled()

		await user.keyboard('gd')
		await waitFor(() =>
			expect(router.state.location.pathname).toBe('/review/due'),
		)
	})

	it('toggles hide mode with Shift+R and reveals the answer, then the notes, with R', async () => {
		const user = userEvent.setup()
		renderRoute(`/cards/${cardId}`)
		await screen.findByDisplayValue(card.primaryText)
		const hideModeButton = screen.getAllByRole('button', {
			name: 'Hide mode',
		})[0]

		// With nothing hidden, R does nothing, and it no longer toggles hiding.
		await user.keyboard('r')
		expect(hideModeButton).toHaveAttribute('aria-pressed', 'false')

		await user.keyboard('{Shift>}R{/Shift}')
		expect(hideModeButton).toHaveAttribute('aria-pressed', 'true')
		expect(screen.getAllByRole('button', { name: 'Reveal' })).toHaveLength(
			2,
		)

		await user.keyboard('r')
		expect(screen.getAllByRole('button', { name: 'Reveal' })).toHaveLength(
			1,
		)
		expect(
			screen.getByRole('textbox', { name: 'Card secondary text' }),
		).toBeInTheDocument()

		await user.keyboard('r')
		expect(
			screen.queryByRole('button', { name: 'Reveal' }),
		).not.toBeInTheDocument()

		await user.keyboard('{Shift>}R{/Shift}')
		expect(hideModeButton).toHaveAttribute('aria-pressed', 'false')
	})

	it('opens the composer with C, minimizes it with Escape, and restores it with C', async () => {
		const user = userEvent.setup()
		renderRoute(`/cards/${cardId}`)
		await screen.findByDisplayValue(card.primaryText)

		// A rating key does nothing on the page; it belongs to the ratings.
		await user.keyboard('3')
		expect(
			screen.queryByRole('form', { name: 'Add review' }),
		).not.toBeInTheDocument()

		// C opens the composer on its selected rating.
		await user.keyboard('c')
		const composer = screen.getByRole('region', { name: 'New review' })
		expect(
			within(composer).getByRole('radio', { name: 'Todo' }),
		).toHaveFocus()

		// Escape minimizes it, leaving focus on the button that restores it.
		await user.keyboard('{Escape}')
		expect(
			within(composer).queryByRole('form', { name: 'Add review' }),
		).not.toBeInTheDocument()
		expect(
			within(composer).getByRole('button', { name: 'New review' }),
		).toHaveFocus()

		await user.keyboard('c')
		expect(
			within(composer).getByRole('radio', { name: 'Todo' }),
		).toHaveFocus()
	})

	it('picks a rating with its key once C focuses the ratings', async () => {
		const user = userEvent.setup()
		const { router } = renderRoute(`/cards/${cardId}`)
		await screen.findByDisplayValue(card.primaryText)

		await user.keyboard('c')
		const composer = screen.getByRole('region', { name: 'New review' })
		// 2 also shows the Reviews tab, but the composer around focus keeps it.
		await user.keyboard('2')
		expect(
			within(composer).getByRole('radio', { name: 'Hard' }),
		).toBeChecked()
		expect(router.state.location.pathname).toBe(`/cards/${cardId}`)
	})

	it('opens the date picker with S, opening the composer too', async () => {
		const user = userEvent.setup()
		renderRoute(`/cards/${cardId}`)
		await screen.findByDisplayValue(card.primaryText)

		await user.keyboard('s')
		expect(
			screen.getByRole('region', { name: 'New review' }),
		).toBeInTheDocument()
		expect(await screen.findByRole('grid')).toBeInTheDocument()
	})

	it('keeps page shortcuts from acting behind a modal dialog', async () => {
		const user = userEvent.setup()
		const mutation = spyOnMutations()
		renderRoute(`/cards/${cardId}`)
		await screen.findByDisplayValue(card.primaryText)

		await user.keyboard('m')
		const dialog = await screen.findByRole('dialog', { name: 'Move card' })
		expect(dialog).toContainElement(document.activeElement as HTMLElement)

		// Focus off any text field, so only the modal rule can block `F`.
		dialog.focus()
		await user.keyboard('f')
		expect(mutation).not.toHaveBeenCalled()
	})

	it('runs card actions from the keyboard, except while typing in a card field', async () => {
		const user = userEvent.setup()
		const mutation = spyOnMutations()
		renderRoute(`/cards/${cardId}`)
		const primaryText = await screen.findByRole('textbox', {
			name: 'Card primary text',
		})

		await user.click(primaryText)
		await user.keyboard('f')
		expect(mutation).not.toHaveBeenCalled()

		// Escape stops editing but keeps focus, so the card's keys work again.
		await user.keyboard('{Escape}')
		expect(primaryText).toHaveFocus()
		expect(primaryText).toHaveAttribute('readonly')
		await user.keyboard('f')
		expect(lastMutationArgs(mutation)).toEqual({
			cardIds: [cardId],
			flaggedAt: expect.any(Number),
		})

		await user.keyboard('t')
		expect(lastMutationArgs(mutation)).toEqual({
			cardIds: [cardId],
			type: 'practice',
		})

		// Move and delete only open their dialogs.
		const calls = mutation.mock.calls.length
		await user.keyboard('m')
		expect(
			await screen.findByRole('dialog', { name: 'Move card' }),
		).toBeInTheDocument()
		await user.keyboard('{Escape}')
		await waitFor(() =>
			expect(
				screen.queryByRole('dialog', { name: 'Move card' }),
			).not.toBeInTheDocument(),
		)

		await user.keyboard('{Control>}{Backspace}{/Control}')
		expect(
			await screen.findByRole('dialog', {
				name: `Delete “${card.primaryText}”?`,
			}),
		).toBeInTheDocument()
		expect(mutation).toHaveBeenCalledTimes(calls)
	})

	it('switches card tabs with 1 and 2, and toggles details with D', async () => {
		const user = userEvent.setup()
		const { router } = renderRoute(`/cards/${cardId}`)
		await screen.findByDisplayValue(card.primaryText)

		await user.keyboard('2')
		await waitFor(() =>
			expect(router.state.location.pathname).toBe(
				`/cards/${cardId}/reviews`,
			),
		)
		await user.keyboard('1')
		await waitFor(() =>
			expect(router.state.location.pathname).toBe(`/cards/${cardId}`),
		)

		expect(
			screen.getByRole('complementary', { name: 'Card details' }),
		).toBeInTheDocument()
		await user.keyboard('d')
		expect(
			screen.queryByRole('complementary', { name: 'Card details' }),
		).not.toBeInTheDocument()
		await user.keyboard('d')
		expect(
			screen.getByRole('complementary', { name: 'Card details' }),
		).toBeInTheDocument()
	})

	it('toggles the queue sidebar with Q, handing focus to its toggle when closing from inside', async () => {
		const user = userEvent.setup()
		renderRoute('/review/new', { newCards: [card, secondCard] })
		const sidebar = await screen.findByRole('complementary', {
			name: 'Queue',
		})

		within(sidebar).getByRole('button', { name: 'Close queue' }).focus()
		await user.keyboard('q')
		expect(
			screen.queryByRole('complementary', { name: 'Queue' }),
		).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Open queue' })).toHaveFocus()

		await user.keyboard('q')
		expect(
			screen.getByRole('complementary', { name: 'Queue' }),
		).toBeInTheDocument()
	})

	it('lists every shortcut with Mod+/, the current page’s groups first', async () => {
		renderRoute('/review/new', { newCards: [card] })
		await screen.findByDisplayValue(card.primaryText)

		fireEvent.keyDown(document.body, {
			key: '/',
			code: 'Slash',
			ctrlKey: true,
		})
		const dialog = await screen.findByRole('dialog', {
			name: 'Keyboard shortcuts',
		})
		const groups = within(dialog)
			.getAllByRole('heading', { level: 3 })
			.map(heading => heading.textContent)

		expect(groups).toEqual([
			'General',
			'Go to',
			'Card',
			'Review composer',
			// Its keys register whenever the composer shows its ratings.
			'Rating',
			'Review queue',
			'Collection',
		])
		expect(within(dialog).getByText('Good')).toBeInTheDocument()
	})

	describe('collection page', () => {
		const section: Doc<'sections'> = {
			_id: 'section-1' as Id<'sections'>,
			_creationTime: 0,
			collectionId,
			ownerId: 'user-1',
			title: 'Type parameters',
			rank: 'a0',
		}
		const sectionCard: Card = {
			...secondCard,
			rank: 'a0',
			sectionId: section._id,
		}

		function renderCollection(mutationResult: unknown = null) {
			const mutation = spyOnMutations(mutationResult)
			const rendered = renderRoute(`/collection/${collectionId}`, {
				collectionCards: [{ ...card, rank: 'a0' }, sectionCard],
				sections: [section],
			})
			return { ...rendered, mutation }
		}

		it('creates a card in the unsectioned group with C, and opens it ready to type', async () => {
			const user = userEvent.setup()
			// The new card resolves to one the cache already holds.
			const { mutation, router } = renderCollection(cardId)
			await screen.findByRole('link', { name: card.primaryText })

			await user.keyboard('c')
			expect(lastMutationArgs(mutation)).toEqual({ collectionId })
			await waitFor(() =>
				expect(router.state.location.pathname).toBe(`/cards/${cardId}`),
			)
			expect(
				await screen.findByRole('textbox', {
					name: 'Card primary text',
				}),
			).toHaveFocus()
		})

		it('adds to the selection’s group with Shift+C and C', async () => {
			const user = userEvent.setup()
			const { mutation } = renderCollection(cardId)
			await user.click(
				await screen.findByRole('link', {
					name: sectionCard.primaryText,
				}),
			)

			await user.keyboard('{Shift>}C{/Shift}')
			expect(lastMutationArgs(mutation)).toEqual({
				collectionId,
				afterId: section._id,
			})

			await user.click(
				screen.getByRole('link', { name: sectionCard.primaryText }),
			)
			await user.keyboard('c')
			expect(lastMutationArgs(mutation)).toEqual({
				collectionId,
				sectionId: section._id,
			})
		})

		it('creates a subcollection with Alt+C', async () => {
			const user = userEvent.setup()
			const { mutation } = renderCollection(collectionId)
			await screen.findByRole('link', { name: card.primaryText })

			await user.keyboard('{Alt>}c{/Alt}')
			expect(lastMutationArgs(mutation)).toEqual({
				parentId: collectionId,
			})
		})

		it('runs the selection’s actions from the keyboard', async () => {
			const user = userEvent.setup()
			const { mutation } = renderCollection()
			await user.click(
				await screen.findByRole('link', { name: card.primaryText }),
			)

			await user.keyboard('f')
			expect(lastMutationArgs(mutation)).toEqual({
				cardIds: [cardId],
				flaggedAt: expect.any(Number),
			})

			await user.keyboard('e')
			expect(lastMutationArgs(mutation)).toEqual({
				cardIds: [cardId],
				retiredAt: expect.any(Number),
			})

			await user.keyboard('{Control>}{Backspace}{/Control}')
			expect(
				await screen.findByRole('dialog', {
					name: `Delete “${card.primaryText}”?`,
				}),
			).toBeInTheDocument()
		})
	})
})
