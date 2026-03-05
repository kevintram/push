import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
	PracticePage,
	type PracticeScope,
	type PracticeTab
} from '~/app/pages/PracticePage'

type PracticeRouteSearch = {
	tab: PracticeTab
	scope?: PracticeScope
}

function isPracticeTab(value: unknown): value is PracticeTab {
	return value === 'due' || value === 'new'
}

function isPracticeScope(value: unknown): value is PracticeScope {
	return value === 'focused' || value === 'all'
}

export function validatePracticeSearch(
	search: Record<string, unknown>
): PracticeRouteSearch {
	const tab = isPracticeTab(search.tab) ? search.tab : 'due'

	if (tab === 'new') {
		return { tab }
	}

	return {
		tab,
		scope: isPracticeScope(search.scope) ? search.scope : 'focused'
	}
}

export const Route = createFileRoute('/_main/practice')({
	validateSearch: validatePracticeSearch,
	component: PracticeRoute
})

function PracticeRoute() {
	const navigate = useNavigate()
	const search = Route.useSearch()

	return (
		<PracticePage
			activeTab={search.tab}
			onActiveTabChange={tab =>
				navigate({
					to: '/practice',
					search: tab === 'new' ? { tab } : { tab, scope: 'focused' }
				})
			}
			onScopeChange={scope =>
				navigate({
					to: '/practice',
					search: { tab: 'due', scope }
				})
			}
			scope={search.scope}
		/>
	)
}
