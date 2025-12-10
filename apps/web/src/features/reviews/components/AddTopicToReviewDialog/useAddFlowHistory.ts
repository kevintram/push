import { useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useRef } from 'react'

/**
 * Hook to track navigation history within the /add flow and cleanly exit it.
 *
 * Problem: When navigating within /reviews/$reviewId/add (e.g., /add -> /add/recent -> /add/topics/123),
 * each navigation creates a history entry. Using `navigate({ replace: true })` only replaces the
 * current entry, leaving previous /add entries in history. This causes the browser back button
 * to return to /add pages after clicking "Done".
 *
 * Solution: This hook subscribes to router navigation events to count how many navigations
 * occur within the /add flow. When `exitFlow` is called, it uses `history.go(-depth)` to
 * go back past all /add entries, then navigates to the target route with `replace: true`.
 *
 * @example
 * ```tsx
 * function AddTopicLayout() {
 *   const { exitFlow } = useAddFlowHistory()
 *
 *   const handleDone = () => {
 *     exitFlow({
 *       to: '/reviews/$reviewId',
 *       params: { reviewId }
 *     })
 *   }
 *
 *   return <Button onClick={handleDone}>Done</Button>
 * }
 * ```
 */
export function useAddFlowHistory() {
	const router = useRouter()
	const navigationCountRef = useRef(0)

	// Subscribe to router navigation events to track how many
	// navigations occur while this hook is mounted
	useEffect(() => {
		const unsubscribe = router.subscribe('onBeforeNavigate', () => {
			navigationCountRef.current += 1
		})

		return () => {
			unsubscribe()
		}
	}, [router])

	/**
	 * Exit the current flow by clearing all history entries created within it.
	 * Goes back past all tracked navigations, then navigates to the destination.
	 */
	const exitFlow = useCallback(
		async (destination: { to: string; params: Record<string, string> }) => {
			// +1 to include the initial /add entry (the page where this hook mounted)
			const depth = navigationCountRef.current + 1

			if (depth > 0) {
				window.history.go(-depth)

				// Wait for the browser to complete the history navigation
				await new Promise<void>(resolve => {
					const handlePopState = () => {
						window.removeEventListener('popstate', handlePopState)
						resolve()
					}
					window.addEventListener('popstate', handlePopState, { once: true })
					// Fallback timeout in case popstate doesn't fire
					setTimeout(() => {
						window.removeEventListener('popstate', handlePopState)
						resolve()
					}, 200)
				})
			}

			// Navigate to the target, replacing the current history entry
			router.navigate({
				// biome-ignore lint/suspicious/noExplicitAny: Route type flexibility needed
				to: destination.to as any,
				// biome-ignore lint/suspicious/noExplicitAny: Params type flexibility needed
				params: destination.params as any,
				replace: true
			})
		},
		[router]
	)

	return { exitFlow }
}
