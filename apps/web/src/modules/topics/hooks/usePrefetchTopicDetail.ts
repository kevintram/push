import { useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useRef } from 'react'

export const TOPIC_DETAIL_INTENT_PRELOAD_DELAY = 100

export function usePrefetchTopicDetail(topicId: number | null | undefined) {
	const router = useRouter()
	const preloadTimeoutRef = useRef<number | null>(null)

	const cancelTopicDetailPreload = useCallback(() => {
		if (preloadTimeoutRef.current != null) {
			window.clearTimeout(preloadTimeoutRef.current)
			preloadTimeoutRef.current = null
		}
	}, [])

	const preloadTopicDetail = useCallback(() => {
		if (topicId == null || topicId < 0) return

		router.preloadRoute({
			to: '/topics/$topicId',
			params: { topicId: topicId.toString() },
		})
	}, [router, topicId])

	const scheduleTopicDetailPreload = useCallback(
		(delay = TOPIC_DETAIL_INTENT_PRELOAD_DELAY) => {
			if (topicId == null || topicId < 0) return

			cancelTopicDetailPreload()

			if (delay <= 0) {
				preloadTopicDetail()
				return
			}

			preloadTimeoutRef.current = window.setTimeout(() => {
				preloadTimeoutRef.current = null
				preloadTopicDetail()
			}, delay)
		},
		[cancelTopicDetailPreload, preloadTopicDetail, topicId],
	)

	useEffect(() => cancelTopicDetailPreload, [cancelTopicDetailPreload])

	return {
		preloadTopicDetail,
		scheduleTopicDetailPreload,
		cancelTopicDetailPreload,
	}
}
