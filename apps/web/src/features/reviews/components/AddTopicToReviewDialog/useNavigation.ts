import { useParams, useRouter } from '@tanstack/react-router'
import { useCallback } from 'react'

export function useNavigation() {
	const router = useRouter()
	const { reviewId } = useParams({ from: '/reviews/$reviewId_/add' })

	const navigateToHome = useCallback(() => {
		router.navigate({
			to: '/reviews/$reviewId/add',
			params: { reviewId }
		})
	}, [router, reviewId])

	const navigateToRecent = useCallback(() => {
		router.navigate({
			to: '/reviews/$reviewId/add/recent',
			params: { reviewId }
		})
	}, [router, reviewId])

	const navigateToInbox = useCallback(() => {
		router.navigate({
			to: '/reviews/$reviewId/add/inbox',
			params: { reviewId }
		})
	}, [router, reviewId])

	const navigateToArchived = useCallback(() => {
		router.navigate({
			to: '/reviews/$reviewId/add/archived',
			params: { reviewId }
		})
	}, [router, reviewId])

	return {
		navigateToHome,
		navigateToRecent,
		navigateToInbox,
		navigateToArchived
	}
}
