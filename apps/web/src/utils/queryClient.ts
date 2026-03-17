import { QueryClient } from '@tanstack/react-query'
import { AuthRedirectError } from '~/utils/apiFetch'

export function shouldRetryQuery(
	failureCount: number,
	error: unknown
): boolean {
	if (error instanceof AuthRedirectError) {
		return false
	}

	return failureCount < 3
}

export function createAppQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: shouldRetryQuery
			}
		}
	})
}
