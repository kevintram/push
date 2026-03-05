import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
	FlashcardsPage,
	type FlashcardsScope,
	type FlashcardsTab
} from '~/app/pages/FlashcardsPage'

type FlashcardsRouteSearch = {
	tab: FlashcardsTab
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
	const tab = isFlashcardsTab(search.tab) ? search.tab : 'due'

	if (tab === 'new') {
		return { tab }
	}

	return {
		tab,
		scope: isFlashcardsScope(search.scope) ? search.scope : 'focused'
	}
}

export const Route = createFileRoute('/_main/flashcards')({
	validateSearch: validateFlashcardsSearch,
	component: FlashcardsRoute
})

function FlashcardsRoute() {
	const navigate = useNavigate()
	const search = Route.useSearch()

	return (
		<FlashcardsPage
			activeTab={search.tab}
			onActiveTabChange={tab =>
				navigate({
					to: '/flashcards',
					search: tab === 'new' ? { tab } : { tab, scope: 'focused' }
				})
			}
			onScopeChange={scope =>
				navigate({
					to: '/flashcards',
					search: { tab: 'due', scope }
				})
			}
			scope={search.scope}
		/>
	)
}
