import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import {
	PracticePage,
	type PracticeScope,
	type PracticeTab
} from '~/app/pages/PracticePage'
import {
	getStoredReviewQueueViewPreference,
	persistReviewQueueViewPreference
} from '~/features/review-cards/reviewQueueViewPreferences'
import { useReviewMode } from '~/stores/ReviewModeContext'

type PracticeRouteSearch = {
	tab?: PracticeTab
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
	return {
		tab: isPracticeTab(search.tab) ? search.tab : undefined,
		scope: isPracticeScope(search.scope) ? search.scope : undefined
	}
}

export const Route = createFileRoute('/_main/practice')({
	validateSearch: validatePracticeSearch,
	component: PracticeRoute
})

function PracticeRoute() {
	const navigate = useNavigate()
	const { setReviewMode } = useReviewMode()
	const search = Route.useSearch()
	const storedView = getStoredReviewQueueViewPreference('practice')
	const activeTab = search.tab ?? storedView.tab
	const dueScope = search.scope ?? storedView.dueScope

	useEffect(() => {
		setReviewMode('on')
	}, [setReviewMode])

	useEffect(() => {
		persistReviewQueueViewPreference('practice', {
			tab: activeTab,
			dueScope
		})
	}, [activeTab, dueScope])

	return (
		<PracticePage
			activeTab={activeTab}
			onActiveTabChange={tab =>
				navigate({
					to: '/practice',
					search: tab === 'new' ? { tab } : { tab, scope: dueScope }
				})
			}
			onScopeChange={scope =>
				navigate({
					to: '/practice',
					search: { tab: 'due', scope }
				})
			}
			scope={dueScope}
		/>
	)
}
