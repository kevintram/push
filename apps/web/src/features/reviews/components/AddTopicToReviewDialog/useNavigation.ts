import { useParams, useRouter } from '@tanstack/react-router'
import { useCallback } from 'react'

export function useNavigation() {
	const router = useRouter()
	const { reviewSessionId } = useParams({
		from: '/review-session/$reviewSessionId_/add'
	})

	const navigateToHome = useCallback(() => {
		router.navigate({
			to: '/review-session/$reviewSessionId/add',
			params: { reviewSessionId }
		})
	}, [router, reviewSessionId])

	const navigateToRecent = useCallback(() => {
		router.navigate({
			to: '/review-session/$reviewSessionId/add/recent',
			params: { reviewSessionId }
		})
	}, [router, reviewSessionId])

	const navigateToInbox = useCallback(() => {
		router.navigate({
			to: '/review-session/$reviewSessionId/add/inbox',
			params: { reviewSessionId }
		})
	}, [router, reviewSessionId])

	const navigateToArchived = useCallback(() => {
		router.navigate({
			to: '/review-session/$reviewSessionId/add/archived',
			params: { reviewSessionId }
		})
	}, [router, reviewSessionId])

	return {
		navigateToHome,
		navigateToRecent,
		navigateToInbox,
		navigateToArchived
	}
}
