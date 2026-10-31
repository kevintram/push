import type { Doc, Id } from '@convex/_generated/dataModel'
import type { Card } from '@convex/validators/cards'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConvexReactClient } from 'convex/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { dueQueries } from '~/modules/reviews/api/dueQueries'
import { todayIso } from '~/utils/date'

import {
	card,
	cardId,
	collection,
	collectionId,
	renderRoute,
	review,
	toNewEntry,
} from './renderRoute'

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

describe('v2 app setup', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('redirects the index route to the due review page', async () => {
		const { router } = renderRoute('/')

		expect(
			await screen.findByRole(
				'heading',
				{ level: 1, name: 'Due' },
				{ timeout: 3000 },
			),
		).toBeInTheDocument()
		expect(router.state.location.pathname).toBe('/review/due')
	})

	it('renders the review route at its default due state', async () => {
		renderRoute('/review')

		expect(
			await screen.findByRole(
				'heading',
				{ level: 1, name: 'Due' },
				{ timeout: 3000 },
			),
		).toBeInTheDocument()
		expect(screen.getByText('No cards.')).toBeInTheDocument()
	})

	it('renders today’s due entry', async () => {
		const today = todayIso()
		renderRoute('/review/due', {
			dueEntries: [
				{
					card: card,
					date: today,
					scheduledReviews: [{ ...review, rating: undefined }],
					srsScheduled: true,
				},
			],
		})

		expect(
			await screen.findByRole('button', {
				name: 'Select What problem do generics solve?',
			}),
		).toBeInTheDocument()
	})

	it('deduplicates late entries for the same card on different days', async () => {
		renderRoute('/review/late', {
			lateEntries: [
				{
					card: card,
					date: '2020-01-02',
					scheduledReviews: [],
					srsScheduled: true,
				},
				{
					card: card,
					date: '2020-01-01',
					scheduledReviews: [{ ...review, rating: undefined }],
					srsScheduled: false,
				},
			],
		})

		const lateQueue = await screen.findByRole('complementary', {
			name: 'Queue',
		})
		expect(
			within(lateQueue).getAllByRole('button', {
				name: 'Select What problem do generics solve?',
			}),
		).toHaveLength(1)
	})

	it('renders new cards without due-entry context', async () => {
		renderRoute('/review/new', { newCards: [card] })

		expect(
			await screen.findByRole('button', {
				name: 'Select What problem do generics solve?',
			}),
		).toBeInTheDocument()
	})

	it('filters the review queue sidebar by card type', async () => {
		const user = userEvent.setup()
		const practiceCard: Card = {
			...card,
			_id: 'practice-card' as Id<'cards'>,
			primaryText: 'Practice prompt',
			type: 'practice',
		}
		const flashcard: Card = {
			...card,
			_id: 'flashcard-card' as Id<'cards'>,
			primaryText: 'Flashcard prompt',
		}
		renderRoute('/review/new', { newCards: [flashcard, practiceCard] })

		const sidebar = await screen.findByRole('complementary', {
			name: 'Queue',
		})
		expect(
			within(sidebar).getByRole('button', {
				name: 'Select Flashcard prompt',
			}),
		).toBeInTheDocument()
		expect(
			within(sidebar).getByRole('button', {
				name: 'Select Practice prompt',
			}),
		).toBeInTheDocument()
		const heading = screen.getByRole('heading', { level: 1, name: 'New' })
		expect(heading).toHaveTextContent('2')

		await user.click(
			within(sidebar).getByRole('radio', { name: 'Flashcards' }),
		)

		expect(
			within(sidebar).getByRole('button', {
				name: 'Select Flashcard prompt',
			}),
		).toBeInTheDocument()
		expect(
			within(sidebar).queryByRole('button', {
				name: 'Select Practice prompt',
			}),
		).not.toBeInTheDocument()
		// The toolbar count is the queue total, not the filtered count.
		expect(heading).toHaveTextContent('2')
	})

	it('filters the flagged review queue by card type', async () => {
		const user = userEvent.setup()
		const practiceCard: Card = {
			...card,
			_id: 'practice-card' as Id<'cards'>,
			flaggedAt: 1,
			primaryText: 'Practice prompt',
			type: 'practice',
		}
		const flashcard: Card = {
			...card,
			_id: 'flashcard-card' as Id<'cards'>,
			flaggedAt: 2,
			primaryText: 'Flashcard prompt',
		}
		renderRoute('/review/flagged', {
			flaggedCards: [flashcard, practiceCard],
		})

		const sidebar = await screen.findByRole('complementary', {
			name: 'Queue',
		})
		expect(
			within(sidebar).getByRole('button', {
				name: 'Select Flashcard prompt',
			}),
		).toBeInTheDocument()
		expect(
			within(sidebar).getByRole('button', {
				name: 'Select Practice prompt',
			}),
		).toBeInTheDocument()

		await user.click(
			within(sidebar).getByRole('radio', { name: 'Not flashcards' }),
		)

		expect(
			within(sidebar).getByRole('button', {
				name: 'Select Practice prompt',
			}),
		).toBeInTheDocument()
		expect(
			within(sidebar).queryByRole('button', {
				name: 'Select Flashcard prompt',
			}),
		).not.toBeInTheDocument()
	})

	it('renders flagged cards in the review workspace', async () => {
		const practiceCard: Card = {
			...card,
			_id: 'practice-card' as Id<'cards'>,
			flaggedAt: 1,
			primaryText: 'Practice prompt',
			type: 'practice',
		}
		const flashcard: Card = {
			...card,
			_id: 'flashcard-card' as Id<'cards'>,
			flaggedAt: 2,
			primaryText: 'Flashcard prompt',
		}
		renderRoute('/review/flagged', {
			flaggedCards: [flashcard, practiceCard],
		})

		expect(
			await screen.findByRole('region', {
				name: 'Flagged review workspace',
			}),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Select Flashcard prompt' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Select Practice prompt' }),
		).toBeInTheDocument()
	})

	it('shows the flagged review workspace empty state', async () => {
		renderRoute('/review/flagged')

		expect(
			await screen.findByRole('region', {
				name: 'Flagged review workspace',
			}),
		).toBeInTheDocument()
		expect(screen.getByText('No cards to review.')).toBeInTheDocument()
		expect(screen.getByText('No cards.')).toBeInTheDocument()
	})

	it('redirects the legacy flagged route into Review', async () => {
		const { router } = renderRoute('/flagged')

		expect(
			await screen.findByRole('region', {
				name: 'Flagged review workspace',
			}),
		).toBeInTheDocument()
		expect(router.state.location.pathname).toBe('/review/flagged')
	})

	it('renders the selected card in the static review workspace', async () => {
		renderRoute('/review/new', { newCards: [card] })

		expect(
			await screen.findByRole('region', {
				name: 'New review workspace',
			}),
		).toBeInTheDocument()
		expect(
			await screen.findByDisplayValue('What problem do generics solve?'),
		).toBeInTheDocument()
		expect(
			screen.queryByRole('dialog', { name: 'Focus cards' }),
		).not.toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'Focus' }),
		).not.toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Previous card' }),
		).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Next card' })).toBeDisabled()
		expect(screen.getByLabelText('Card primary text')).not.toHaveAttribute(
			'readonly',
		)
		// A real anchor, so middle-click and open-in-new-tab still work.
		const openLink = screen.getByRole('link', {
			name: 'Go to card',
		})
		expect(openLink.tagName).toBe('A')
		expect(openLink).toHaveAttribute('href', '/cards/card-1')
		expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
			'aria-selected',
			'true',
		)
		expect(screen.getByRole('tab', { name: 'Overview' }).tagName).toBe(
			'BUTTON',
		)
		expect(
			screen.getByRole('complementary', {
				name: 'Card details',
			}),
		).toBeInTheDocument()
	})

	it('selects a card from the review sidebar without changing routes', async () => {
		const user = userEvent.setup()
		const secondCard: Card = {
			...card,
			_id: 'card-2' as Id<'cards'>,
			primaryText: 'What is a discriminated union?',
		}
		const { router } = renderRoute('/review/new', {
			newCards: [card, secondCard],
		})

		const sidebar = await screen.findByRole('complementary', {
			name: 'Queue',
		})
		const firstCardButton = within(sidebar).getByRole('button', {
			name: 'Select What problem do generics solve?',
		})
		const secondCardButton = within(sidebar).getByRole('button', {
			name: 'Select What is a discriminated union?',
		})

		expect(firstCardButton).toHaveAttribute('aria-current', 'true')
		expect(secondCardButton).not.toHaveAttribute('aria-current')

		await user.click(secondCardButton)

		expect(
			await screen.findByDisplayValue('What is a discriminated union?'),
		).toBeInTheDocument()
		expect(secondCardButton).toHaveAttribute('aria-current', 'true')
		expect(firstCardButton).not.toHaveAttribute('aria-current')
		expect(router.state.location.pathname).toBe('/review/new')
	})

	it('keeps sidebar selection in sync with previous and next controls', async () => {
		const user = userEvent.setup()
		const secondCard: Card = {
			...card,
			_id: 'card-2' as Id<'cards'>,
			primaryText: 'What is a discriminated union?',
		}
		const thirdCard: Card = {
			...card,
			_id: 'card-3' as Id<'cards'>,
			primaryText: 'What is type narrowing?',
		}
		renderRoute('/review/new', {
			newCards: [card, secondCard, thirdCard],
		})

		const sidebar = await screen.findByRole('complementary', {
			name: 'Queue',
		})
		const firstCardButton = within(sidebar).getByRole('button', {
			name: 'Select What problem do generics solve?',
		})
		const secondCardButton = within(sidebar).getByRole('button', {
			name: 'Select What is a discriminated union?',
		})
		const thirdCardButton = within(sidebar).getByRole('button', {
			name: 'Select What is type narrowing?',
		})

		await user.click(screen.getByRole('button', { name: 'Next card' }))
		expect(secondCardButton).toHaveAttribute('aria-current', 'true')
		expect(firstCardButton).not.toHaveAttribute('aria-current')

		await user.click(screen.getByRole('button', { name: 'Next card' }))
		expect(thirdCardButton).toHaveAttribute('aria-current', 'true')

		await user.click(screen.getByRole('button', { name: 'Previous card' }))
		expect(secondCardButton).toHaveAttribute('aria-current', 'true')
	})

	it('does not select a review row when a nested card action is clicked', async () => {
		const user = userEvent.setup()
		const secondCard: Card = {
			...card,
			_id: 'card-2' as Id<'cards'>,
			primaryText: 'What is a discriminated union?',
		}
		renderRoute('/review/new', { newCards: [card, secondCard] })

		const sidebar = await screen.findByRole('complementary', {
			name: 'Queue',
		})
		expect(
			within(sidebar).getByRole('button', {
				name: 'Select What problem do generics solve?',
			}),
		).toHaveAttribute('aria-current', 'true')
		const secondCardButton = within(sidebar).getByRole('button', {
			name: 'Select What is a discriminated union?',
		})

		await user.click(
			within(secondCardButton.closest('tr')!).getByRole('button', {
				name: 'Remove as flashcard',
			}),
		)

		expect(
			within(sidebar).getByRole('button', {
				name: 'Select What problem do generics solve?',
			}),
		).toHaveAttribute('aria-current', 'true')
		expect(secondCardButton).not.toHaveAttribute('aria-current')
	})

	it('does not toggle or exit the static review workspace', async () => {
		const user = userEvent.setup()
		renderRoute('/review/new', { newCards: [card] })

		await screen.findByRole('region', { name: 'New review workspace' })
		await user.keyboard('f')

		expect(
			screen.getByRole('region', { name: 'New review workspace' }),
		).toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'Close' }),
		).not.toBeInTheDocument()
	})

	it('resets the card tab when advancing to another card', async () => {
		const user = userEvent.setup()
		const secondCard: Card = {
			...card,
			_id: 'card-2' as Id<'cards'>,
			primaryText: 'What is a discriminated union?',
		}
		renderRoute('/review/new', { newCards: [card, secondCard] })

		await user.click(await screen.findByRole('tab', { name: 'Reviews' }))
		await waitFor(() =>
			expect(
				screen.getByRole('tab', { name: 'Reviews' }),
			).toHaveAttribute('aria-selected', 'true'),
		)

		await user.click(screen.getByRole('button', { name: 'Next card' }))

		expect(
			await screen.findByDisplayValue('What is a discriminated union?'),
		).toBeInTheDocument()
		expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
			'aria-selected',
			'true',
		)
	})

	it('navigates the review queue with J and K', async () => {
		const user = userEvent.setup()
		const secondCard: Card = {
			...card,
			_id: 'card-2' as Id<'cards'>,
			primaryText: 'What is a discriminated union?',
		}
		const thirdCard: Card = {
			...card,
			_id: 'card-3' as Id<'cards'>,
			primaryText: 'What is type narrowing?',
		}
		renderRoute('/review/new', {
			newCards: [card, secondCard, thirdCard],
		})

		await screen.findByRole('button', { name: 'Next card' })
		const sidebar = screen.getByRole('complementary', { name: 'Queue' })
		const firstCardButton = within(sidebar).getByRole('button', {
			name: 'Select What problem do generics solve?',
		})
		const secondCardButton = within(sidebar).getByRole('button', {
			name: 'Select What is a discriminated union?',
		})
		const thirdCardButton = within(sidebar).getByRole('button', {
			name: 'Select What is type narrowing?',
		})
		await user.keyboard('j')
		expect(
			await screen.findByDisplayValue('What is a discriminated union?'),
		).toBeInTheDocument()
		expect(secondCardButton).toHaveAttribute('aria-current', 'true')

		await user.keyboard('k')
		expect(
			await screen.findByDisplayValue('What problem do generics solve?'),
		).toBeInTheDocument()
		expect(firstCardButton).toHaveAttribute('aria-current', 'true')

		await user.keyboard('jj')
		expect(
			await screen.findByDisplayValue('What is type narrowing?'),
		).toBeInTheDocument()
		expect(thirdCardButton).toHaveAttribute('aria-current', 'true')
	})

	it('preserves keyboard behavior in review queue controls', async () => {
		const user = userEvent.setup()
		const secondCard: Card = {
			...card,
			_id: 'card-2' as Id<'cards'>,
			primaryText: 'What is a discriminated union?',
		}
		renderRoute('/review/new', { newCards: [card, secondCard] })

		const reviewsTab = await screen.findByRole('tab', { name: 'Reviews' })
		await user.click(reviewsTab)
		await user.keyboard('{ArrowLeft}')

		const overviewTab = screen.getByRole('tab', { name: 'Overview' })
		expect(overviewTab).toHaveFocus()

		await user.click(overviewTab)
		const primaryText = screen.getByLabelText('Card primary text')
		await user.click(primaryText)
		fireEvent.keyDown(primaryText, { key: 'j' })
		expect(
			screen.getByDisplayValue('What problem do generics solve?'),
		).toBeInTheDocument()
	})

	it('keeps the card under an open dialog when J is pressed', async () => {
		const user = userEvent.setup()
		const secondCard: Card = {
			...card,
			_id: 'card-2' as Id<'cards'>,
			primaryText: 'What is a discriminated union?',
		}
		renderRoute('/review/new', { newCards: [card, secondCard] })

		await user.click(
			await screen.findByRole('button', {
				name: 'Expand review composer',
			}),
		)
		const dialog = screen.getByRole('dialog', { name: 'New review' })
		// The dialog focuses its description, and text fields already keep J.
		within(dialog)
			.getByRole('button', { name: 'Minimize review composer' })
			.focus()
		await user.keyboard('j')
		expect(
			screen.getByDisplayValue('What problem do generics solve?'),
		).toBeInTheDocument()
		expect(dialog).toBeInTheDocument()
	})

	it('follows a breadcrumb directly from the static workspace', async () => {
		const user = userEvent.setup()
		const { router } = renderRoute('/review/new', { newCards: [card] })

		const workspace = await screen.findByRole('region', {
			name: 'New review workspace',
		})
		await user.click(
			within(workspace).getByRole('link', {
				name: 'Learning TypeScript',
			}),
		)

		await waitFor(() =>
			expect(router.state.location.pathname).toBe(
				`/collection/${collectionId}`,
			),
		)
	})

	it('keeps the selected card mounted in the static workspace', async () => {
		const user = userEvent.setup()
		const secondCard: Card = {
			...card,
			_id: 'card-2' as Id<'cards'>,
			primaryText: 'What is a discriminated union?',
		}
		renderRoute('/review/new', { newCards: [card, secondCard] })

		await user.click(
			await screen.findByRole('button', { name: 'Next card' }),
		)
		expect(
			await screen.findByDisplayValue('What is a discriminated union?'),
		).toBeInTheDocument()

		await user.keyboard('f')
		expect(
			await screen.findByDisplayValue('What is a discriminated union?'),
		).toBeInTheDocument()
	})

	it('keeps the selected card stable as the review queue changes', async () => {
		const user = userEvent.setup()
		const secondCard: Card = {
			...card,
			_id: 'card-2' as Id<'cards'>,
			primaryText: 'What is a discriminated union?',
		}
		const thirdCard: Card = {
			...card,
			_id: 'card-3' as Id<'cards'>,
			primaryText: 'What is type narrowing?',
		}
		const { queryClient } = renderRoute('/review/new', {
			newCards: [card, secondCard, thirdCard],
		})

		await user.click(
			await screen.findByRole('button', { name: 'Next card' }),
		)

		act(() => {
			queryClient.setQueryData(
				dueQueries.listNew().queryKey,
				[secondCard, thirdCard].map(toNewEntry),
			)
		})
		expect(
			await screen.findByDisplayValue('What is a discriminated union?'),
		).toBeInTheDocument()

		act(() => {
			queryClient.setQueryData(
				dueQueries.listNew().queryKey,
				[thirdCard].map(toNewEntry),
			)
		})
		expect(
			await screen.findByDisplayValue('What is type narrowing?'),
		).toBeInTheDocument()

		act(() => {
			queryClient.setQueryData(
				dueQueries.listNew().queryKey,
				[card, thirdCard].map(toNewEntry),
			)
		})
		expect(
			await screen.findByDisplayValue('What is type narrowing?'),
		).toBeInTheDocument()
	})

	it('renders an empty static review workspace', async () => {
		const user = userEvent.setup()
		renderRoute('/review/new')

		expect(
			await screen.findByRole('region', { name: 'New review workspace' }),
		).toBeInTheDocument()
		expect(screen.getByText('No cards to review.')).toBeInTheDocument()
		expect(screen.getByText('No cards.')).toBeInTheDocument()
		const sidebar = screen.getByRole('complementary', { name: 'Queue' })
		expect(
			within(sidebar).queryAllByRole('button', { name: /^Select / }),
		).toHaveLength(0)

		await user.keyboard('f')
		expect(
			screen.queryByRole('dialog', { name: 'Focus cards' }),
		).not.toBeInTheDocument()
	})

	it.each([
		['/review/flagged', 'Flagged'],
		['/settings', 'Settings'],
	])('renders the %s route', async (path, heading) => {
		renderRoute(path)

		expect(
			await screen.findByRole('heading', { name: heading }),
		).toBeInTheDocument()
	})

	it('puts account settings on the settings route', async () => {
		renderRoute('/settings')

		expect(
			await screen.findByRole('heading', { name: 'Account' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Sign out' }),
		).toBeInTheDocument()
	})

	it('toggles the sidebar presentation on the settings route', async () => {
		const user = userEvent.setup()
		renderRoute('/settings')

		await screen.findByRole('heading', { name: 'Account' })
		const primaryNavigation = screen.getByRole('navigation', {
			name: 'primary',
		})

		expect(
			within(primaryNavigation).getByRole('button', {
				name: 'Expand sidebar',
			}),
		).toBeEnabled()
		expect(
			within(primaryNavigation).getByRole('link', { name: 'Due' }),
		).toBeInTheDocument()
		expect(
			within(primaryNavigation).getByRole('link', { name: 'Flagged' }),
		).toBeInTheDocument()
		expect(
			within(primaryNavigation).getByRole('link', { name: 'Settings' }),
		).toBeInTheDocument()
		expect(
			within(primaryNavigation).queryByText('Collections'),
		).not.toBeInTheDocument()

		await user.click(
			within(primaryNavigation).getByRole('button', {
				name: 'Expand sidebar',
			}),
		)

		const expandedNavigation = screen.getByRole('navigation', {
			name: 'primary',
		})
		const collapseToggle = within(expandedNavigation).getByRole('button', {
			name: 'Collapse sidebar',
		})
		expect(collapseToggle).toHaveFocus()
		expect(
			within(expandedNavigation).getByRole('navigation', {
				name: 'Collection tree',
			}),
		).toBeInTheDocument()
		expect(window.localStorage.getItem('appSidebarExpanded')).toBe('true')

		await user.click(collapseToggle)

		expect(
			screen.getByRole('button', { name: 'Expand sidebar' }),
		).toHaveFocus()
		expect(
			screen.queryByRole('navigation', { name: 'Collection tree' }),
		).not.toBeInTheDocument()
	})

	it('groups hide mode immediately before search in the sidebar header', async () => {
		renderRoute('/settings')

		await screen.findByRole('heading', { name: 'Account' })
		const primaryNavigation = screen.getByRole('navigation', {
			name: 'primary',
		})
		const hideModeButton = within(primaryNavigation).getByRole('button', {
			name: 'Hide mode',
		})
		const searchButton = within(primaryNavigation).getByRole('button', {
			name: 'Search',
		})

		expect(hideModeButton.parentElement).toBe(searchButton.parentElement)
		expect(hideModeButton.nextElementSibling).toBe(searchButton)
	})

	it('opens search over the current page without navigating away', async () => {
		const user = userEvent.setup()
		renderRoute('/settings')

		await screen.findByRole('heading', { name: 'Account' })
		await user.click(screen.getByRole('button', { name: 'Search' }))

		expect(
			await screen.findByRole('searchbox', {
				name: 'Search collections and cards',
			}),
		).toBeInTheDocument()
		// The settings page stays mounted behind the modal, so it is only
		// hidden from the accessibility tree rather than unmounted.
		expect(
			screen.getByRole('heading', { hidden: true, name: 'Account' }),
		).toBeInTheDocument()
	})

	it('opens search with the primary-modifier K shortcut', async () => {
		const user = userEvent.setup()
		renderRoute('/settings')

		await screen.findByRole('heading', { name: 'Account' })
		await user.keyboard('{Control>}k{/Control}')

		expect(
			await screen.findByRole('searchbox', {
				name: 'Search collections and cards',
			}),
		).toBeInTheDocument()
		expect(
			screen.getByRole('heading', { hidden: true, name: 'Account' }),
		).toBeInTheDocument()
	})

	it.each(['/library', '/collection'])(
		'renders the not found route at %s',
		async path => {
			renderRoute(path)

			expect(
				await screen.findByRole('heading', { name: 'Page not found' }),
			).toBeInTheDocument()
		},
	)

	it('renders a collection breadcrumb through its ancestors', async () => {
		const root: Doc<'collections'> = {
			...collection,
			_id: 'collection-root' as Id<'collections'>,
			title: 'Programming',
		}
		const parent: Doc<'collections'> = {
			...collection,
			_id: 'collection-parent' as Id<'collections'>,
			parentId: root._id,
			title: 'Languages',
		}

		renderRoute(`/collection/${collectionId}`, {
			ancestors: [root, parent],
		})

		const breadcrumb = await screen.findByRole('navigation', {
			name: 'Collection path',
		})
		const links = within(breadcrumb).getAllByRole('link')
		expect(links.map(link => link.textContent)).toEqual([
			'Programming',
			'Languages',
		])
		expect(links[0]).toHaveAttribute('href', `/collection/${root._id}`)
		expect(links[1]).toHaveAttribute('href', `/collection/${parent._id}`)
		expect(
			within(breadcrumb).getByText('Learning TypeScript'),
		).toHaveAttribute('aria-current', 'page')
	})

	it('lists only direct children in the subcollections panel', async () => {
		const child: Doc<'collections'> = {
			...collection,
			_id: 'collection-child' as Id<'collections'>,
			parentId: collectionId,
			title: 'Generics',
		}
		const unrelated: Doc<'collections'> = {
			...collection,
			_id: 'collection-unrelated' as Id<'collections'>,
			title: 'Unrelated',
		}

		renderRoute(`/collection/${collectionId}`, {
			collections: [child, unrelated],
		})

		const panel = await screen.findByRole('region', {
			name: 'Subcollections',
		})
		expect(
			within(panel).getByRole('link', { name: 'Generics' }),
		).toHaveAttribute('href', `/collection/${child._id}`)
		expect(
			within(panel).queryByRole('link', { name: 'Unrelated' }),
		).not.toBeInTheDocument()
	})

	it('groups collection cards under their sections, unsectioned cards first', async () => {
		const sectionId = 'section-1' as Id<'sections'>
		const section: Doc<'sections'> = {
			_id: sectionId,
			_creationTime: 0,
			collectionId,
			ownerId: 'user-1',
			title: 'Type parameters',
		}
		const emptySection: Doc<'sections'> = {
			...section,
			_id: 'section-2' as Id<'sections'>,
			title: '',
		}
		const sectionedCard: Card = {
			...card,
			_id: 'card-sectioned' as Id<'cards'>,
			primaryText: 'What does a constraint do?',
			sectionId,
		}

		renderRoute(`/collection/${collectionId}`, {
			collectionCards: [sectionedCard, card],
			sections: [section, emptySection],
		})

		const tables = await screen.findAllByRole('table')
		expect(tables).toHaveLength(3)
		const [unsectioned, typeParameters, untitled] = tables as [
			HTMLElement,
			HTMLElement,
			HTMLElement,
		]
		expect(
			within(unsectioned).getByRole('heading', { name: 'Cards' }),
		).toBeInTheDocument()
		expect(
			within(unsectioned).getByText(card.primaryText),
		).toBeInTheDocument()
		expect(
			within(typeParameters).getByRole('button', {
				name: 'Type parameters',
			}),
		).toBeInTheDocument()
		expect(
			within(typeParameters).getByText(sectionedCard.primaryText),
		).toBeInTheDocument()
		expect(
			within(untitled).getByRole('button', { name: 'Untitled section' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Add to Type parameters' }),
		).toBeInTheDocument()
		expect(
			screen.getAllByRole('button', { name: 'Section actions' }),
		).toHaveLength(2)
	})

	describe('collection selection', () => {
		const section: Doc<'sections'> = {
			_id: 'section-1' as Id<'sections'>,
			_creationTime: 0,
			collectionId,
			ownerId: 'user-1',
			title: 'Type parameters',
			rank: 'a0',
		}
		const secondCard: Card = {
			...card,
			_id: 'card-2' as Id<'cards'>,
			_creationTime: 1,
			primaryText: 'What is a type parameter?',
			rank: 'a1',
		}
		const firstCard: Card = { ...card, rank: 'a0' }

		function renderCollection() {
			const mutation = vi
				.spyOn(ConvexReactClient.prototype, 'mutation')
				.mockResolvedValue(null)
			const rendered = renderRoute(`/collection/${collectionId}`, {
				collectionCards: [firstCard, secondCard],
				sections: [section],
			})
			return { ...rendered, mutation }
		}

		afterEach(() => {
			vi.restoreAllMocks()
		})

		it('selects a card on click and opens it on double click', async () => {
			const user = userEvent.setup()
			const { router } = renderCollection()
			const link = await screen.findByRole('link', {
				name: firstCard.primaryText,
			})

			await user.click(link)
			expect(router.state.location.pathname).toBe(
				`/collection/${collectionId}`,
			)
			expect(link).toHaveFocus()

			await user.dblClick(link)
			await waitFor(() =>
				expect(router.state.location.pathname).toBe(`/cards/${cardId}`),
			)
		})

		it('moves the selected card with Mod+arrows, across into a section', async () => {
			const user = userEvent.setup()
			const { mutation } = renderCollection()
			await user.click(
				await screen.findByRole('link', {
					name: firstCard.primaryText,
				}),
			)

			await user.keyboard('{Control>}{ArrowDown}{/Control}')
			expect(mutation).toHaveBeenLastCalledWith(
				expect.anything(),
				{ cardIds: [cardId], sectionId: null, afterId: secondCard._id },
				expect.anything(),
			)

			// The selection moves to the second card, the bottom of its list,
			// and from there down crosses into the section below.
			await user.keyboard('{ArrowDown}')
			expect(
				screen.getByRole('link', { name: secondCard.primaryText }),
			).toHaveFocus()
			await user.keyboard('{Control>}{ArrowDown}{/Control}')
			expect(mutation).toHaveBeenLastCalledWith(
				expect.anything(),
				{
					cardIds: [secondCard._id],
					sectionId: section._id,
					afterId: null,
				},
				expect.anything(),
			)
		})

		it('selects several items with Shift and Mod, and moves cards as one run', async () => {
			const user = userEvent.setup()
			const { mutation } = renderCollection()
			const first = await screen.findByRole('link', {
				name: firstCard.primaryText,
			})
			const second = screen.getByRole('link', {
				name: secondCard.primaryText,
			})

			await user.click(first)
			expect(screen.getByRole('toolbar')).toHaveTextContent('1 card')
			await user.keyboard('{Shift>}{ArrowDown}{/Shift}')
			expect(second).toHaveFocus()
			// Clicks on the action bar itself keep the selection.
			await user.click(screen.getByText('2 cards'))
			expect(screen.getByRole('toolbar')).toHaveTextContent('2 cards')
			await user.keyboard('{Control>}{ArrowDown}{/Control}')
			expect(mutation).toHaveBeenLastCalledWith(
				expect.anything(),
				{
					cardIds: [firstCard._id, secondCard._id],
					sectionId: section._id,
					afterId: null,
				},
				expect.anything(),
			)

			// Mod-click takes the first card back out, leaving the second.
			await user.keyboard('{Control>}')
			await user.click(first)
			await user.keyboard('{/Control}')
			await user.keyboard('{Control>}{ArrowUp}{/Control}')
			expect(mutation).toHaveBeenLastCalledWith(
				expect.anything(),
				{ cardIds: [secondCard._id], sectionId: null, afterId: null },
				expect.anything(),
			)

			// Shift-click selects the range from the anchor.
			await user.click(first)
			await user.keyboard('{Shift>}')
			await user.click(second)
			await user.keyboard('{/Shift}')
			await user.keyboard('{Control>}{ArrowDown}{/Control}')
			expect(mutation).toHaveBeenLastCalledWith(
				expect.anything(),
				{
					cardIds: [firstCard._id, secondCard._id],
					sectionId: section._id,
					afterId: null,
				},
				expect.anything(),
			)

			// Extending past the cards takes in the section header below. A
			// selection of sections and cards has nowhere to move.
			await user.keyboard('{Shift>}{ArrowDown}{/Shift}')
			expect(screen.getByRole('toolbar')).toHaveTextContent(
				'1 section, 2 cards',
			)
			const calls = mutation.mock.calls.length
			await user.keyboard('{Control>}{ArrowDown}{/Control}')
			expect(mutation).toHaveBeenCalledTimes(calls)

			await user.keyboard('{Escape}')
			expect(screen.queryByRole('toolbar')).not.toBeInTheDocument()
		})

		it('starts a selection with the arrows: down at the first item, up at the last', async () => {
			const user = userEvent.setup()
			renderCollection()
			const first = await screen.findByRole('link', {
				name: firstCard.primaryText,
			})

			// Arrows typed in a field keep moving its caret.
			await user.click(
				screen.getByRole('textbox', { name: 'Collection description' }),
			)
			await user.keyboard('{ArrowDown}')
			expect(screen.queryByRole('toolbar')).not.toBeInTheDocument()

			// Focus on another control, like the sidebar link that opened the
			// page, moves to the selected item.
			screen.getByRole('link', { name: 'Settings' }).focus()
			await user.keyboard('{ArrowDown}')
			expect(first).toHaveFocus()
			expect(screen.getByRole('toolbar')).toHaveTextContent('1 card')

			await user.keyboard('{Escape}')
			await user.keyboard('{ArrowUp}')
			const items = document.querySelectorAll(
				'[data-card-id], [data-section-id]',
			)
			expect(items[items.length - 1]).toHaveFocus()
		})

		it('selects everything with Mod+A, but leaves it to a field', async () => {
			const user = userEvent.setup()
			renderCollection()
			const first = await screen.findByRole('link', {
				name: firstCard.primaryText,
			})

			await user.click(
				screen.getByRole('textbox', { name: 'Collection description' }),
			)
			await user.keyboard('{Control>}a{/Control}')
			expect(screen.queryByRole('toolbar')).not.toBeInTheDocument()

			screen.getByRole('link', { name: 'Settings' }).focus()
			await user.keyboard('{Control>}a{/Control}')
			expect(screen.getByRole('toolbar')).toHaveTextContent(
				'1 section, 2 cards',
			)
			// Focus stays at the top rather than jumping to the last item.
			expect(first).toHaveFocus()
		})

		it('opens the selected card with Enter, and clears the selection with Escape or an empty click', async () => {
			const user = userEvent.setup()
			const { router, mutation } = renderCollection()
			await user.click(
				await screen.findByRole('link', {
					name: secondCard.primaryText,
				}),
			)

			await user.keyboard('{Escape}')
			await user.keyboard('{Control>}{ArrowUp}{/Control}')
			expect(mutation).not.toHaveBeenCalled()

			// So does a click on empty page space.
			await user.click(
				screen.getByRole('link', { name: secondCard.primaryText }),
			)
			await user.click(screen.getByText('Subcollections'))
			await user.keyboard('{Control>}{ArrowUp}{/Control}')
			expect(mutation).not.toHaveBeenCalled()

			await user.click(
				screen.getByRole('link', { name: secondCard.primaryText }),
			)
			await user.keyboard('{Enter}')
			await waitFor(() =>
				expect(router.state.location.pathname).toBe(
					`/cards/${secondCard._id}`,
				),
			)
		})

		it('selects a section on click, moves it, and renames it on double click or Enter', async () => {
			const user = userEvent.setup()
			const { mutation } = renderCollection()
			const title = await screen.findByRole('button', {
				name: 'Type parameters',
			})

			await user.click(title)
			await user.keyboard('{Control>}{ArrowUp}{/Control}')
			// The only section is already first.
			expect(mutation).not.toHaveBeenCalled()

			await user.keyboard('{Enter}')
			const field = screen.getByRole('textbox', { name: 'Section title' })
			expect(field).toHaveFocus()
			expect(field).toHaveValue('Type parameters')

			// Arrows keep moving the caret while renaming.
			await user.keyboard('{Control>}{ArrowUp}{/Control}{Escape}')
			expect(mutation).not.toHaveBeenCalled()
			expect(
				screen.queryByRole('textbox', { name: 'Section title' }),
			).not.toBeInTheDocument()

			await user.dblClick(
				screen.getByRole('button', { name: 'Type parameters' }),
			)
			expect(
				screen.getByRole('textbox', { name: 'Section title' }),
			).toHaveFocus()
		})
	})

	it('renders the shared error page when a collection does not exist', async () => {
		renderRoute(`/collection/${collectionId}`, {
			missingCollection: true,
		})

		expect(
			await screen.findByRole('heading', {
				name: 'Something went wrong',
			}),
		).toBeInTheDocument()
		expect(screen.getByText('Collection not found')).toBeInTheDocument()
	})

	it('renders a card at its standalone route', async () => {
		const root: Doc<'collections'> = {
			...collection,
			_id: 'collection-root' as Id<'collections'>,
			title: 'Programming',
		}

		renderRoute(`/cards/${cardId}`, { ancestors: [root] })

		const primaryText = await screen.findByLabelText('Card primary text')
		expect(primaryText).toHaveValue('What problem do generics solve?')
		expect(primaryText).toHaveAttribute('placeholder', 'Prompt')
		expect(screen.getByLabelText('Card secondary text')).toHaveAttribute(
			'placeholder',
			'Answer',
		)
		const breadcrumb = screen.getByRole('navigation', {
			name: 'Collection path',
		})
		const links = within(breadcrumb).getAllByRole('link')
		expect(links.map(link => link.textContent)).toEqual([
			'Programming',
			'Learning TypeScript',
		])
		expect(links[0]).toHaveAttribute('href', `/collection/${root._id}`)
		expect(links[1]).toHaveAttribute('href', `/collection/${collectionId}`)
		expect(
			within(breadcrumb).getByText('What problem do generics solve?'),
		).toHaveAttribute('aria-current', 'page')
		expect(
			screen.queryByRole('navigation', { name: 'Collection tree' }),
		).not.toBeInTheDocument()
	})

	it('uses practice-specific card placeholders', async () => {
		renderRoute(`/cards/${cardId}`, {
			cardType: 'practice',
		})

		expect(
			await screen.findByLabelText('Card primary text'),
		).toHaveAttribute('placeholder', 'Title')
		expect(screen.getByLabelText('Card secondary text')).toHaveAttribute(
			'placeholder',
			'Add description...',
		)
	})

	it('renders the shared error page when a card does not exist', async () => {
		renderRoute(`/cards/${cardId}`, {
			missingCard: true,
		})

		expect(
			await screen.findByRole('heading', {
				name: 'Something went wrong',
			}),
		).toBeInTheDocument()
		expect(screen.getByText('Card not found')).toBeInTheDocument()
	})

	it('renders review history under the standalone card route', async () => {
		const { router } = renderRoute(`/cards/${cardId}/reviews`)

		expect(
			await screen.findAllByText('Correctly described generics.'),
		).not.toHaveLength(0)
		const sidebar = screen.getByRole('complementary', {
			name: 'Card details',
		})
		expect(
			within(sidebar).getByRole('region', { name: 'Properties' }),
		).toBeInTheDocument()
		expect(
			within(sidebar).queryByRole('region', { name: 'Reviews' }),
		).not.toBeInTheDocument()
		expect(
			screen.queryByRole('form', { name: 'Add review' }),
		).not.toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'New review' }),
		).toBeInTheDocument()
		expect(screen.getByRole('tab', { name: 'Reviews' })).toHaveAttribute(
			'aria-selected',
			'true',
		)
		expect(router.state.location.pathname).toBe(`/cards/${cardId}/reviews`)
	})

	it('renders history in the Overview sidebar and docks the composer', async () => {
		renderRoute(`/cards/${cardId}`)

		const sidebar = await screen.findByRole('complementary', {
			name: 'Card details',
		})
		expect(
			within(sidebar).getByRole('region', { name: 'Properties' }),
		).toBeInTheDocument()
		expect(
			within(sidebar).queryByRole('form', { name: 'Add review' }),
		).not.toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'New review' }),
		).toBeInTheDocument()
		expect(
			within(sidebar).getByRole('region', { name: 'Reviews' }),
		).toBeInTheDocument()
	})

	it('updates the standalone URL when changing card tabs', async () => {
		const user = userEvent.setup()
		const { router } = renderRoute(`/cards/${cardId}`)
		const reviewsTab = await screen.findByRole('tab', { name: 'Reviews' })

		expect(reviewsTab.tagName).toBe('A')
		expect(reviewsTab).toHaveAttribute('href', `/cards/${cardId}/reviews`)
		await user.click(reviewsTab)

		await waitFor(() =>
			expect(router.state.location.pathname).toBe(
				`/cards/${cardId}/reviews`,
			),
		)
		expect(screen.getByRole('tab', { name: 'Reviews' })).toHaveAttribute(
			'aria-selected',
			'true',
		)
	})

	it('renders the not found route', async () => {
		renderRoute('/missing')

		expect(
			await screen.findByRole('heading', { name: 'Page not found' }),
		).toBeInTheDocument()
	})
})
