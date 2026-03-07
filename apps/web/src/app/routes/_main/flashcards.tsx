import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import {
	FlashcardsPage,
	type FlashcardsScope,
	type FlashcardsTab
} from '~/app/pages/FlashcardsPage'
import {
	getStoredReviewQueueViewPreference,
	persistReviewQueueViewPreference
} from '~/features/review-cards/reviewQueueViewPreferences'

type FlashcardsRouteSearch = {
	tab?: FlashcardsTab
	scope?: FlashcardsScope
}

function isFlashcardsTab(value: unknown): value is FlashcardsTab {
	return value === 'due' || value === 'new'
}

function isFlashcardsScope(value: unknown): value is FlashcardsScope {
	return value === 'focused' || value === 'all'
}

export function validateFlashcardsSearch(
	search: Record<string, unknown>
): FlashcardsRouteSearch {
	return {
		tab: isFlashcardsTab(search.tab) ? search.tab : undefined,
		scope: isFlashcardsScope(search.scope) ? search.scope : undefined
	}
}

export const Route = createFileRoute('/_main/flashcards')({
	validateSearch: validateFlashcardsSearch,
	component: FlashcardsRoute
})

function FlashcardsRoute() {
	const navigate = useNavigate()
	const search = Route.useSearch()
	const storedView = getStoredReviewQueueViewPreference('flashcards')
	const activeTab = search.tab ?? storedView.tab
	const dueScope = search.scope ?? storedView.dueScope

	useEffect(() => {
		persistReviewQueueViewPreference('flashcards', {
			tab: activeTab,
			dueScope
		})
	}, [activeTab, dueScope])

	return (
		<FlashcardsPage
			activeTab={activeTab}
			onActiveTabChange={tab =>
				navigate({
					to: '/flashcards',
					search: tab === 'new' ? { tab } : { tab, scope: dueScope }
				})
			}
			onScopeChange={scope =>
				navigate({
					to: '/flashcards',
					search: { tab: 'due', scope }
				})
			}
			scope={dueScope}
		/>
	)
}
