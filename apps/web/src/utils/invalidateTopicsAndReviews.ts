import type { QueryClient } from '@tanstack/react-query'

export function invalidateTopicsAndReviews(queryClient: QueryClient) {
	return Promise.all([
		queryClient.invalidateQueries({ queryKey: ['topics'] }),
		queryClient.invalidateQueries({ queryKey: ['reviews'] })
	])
}
