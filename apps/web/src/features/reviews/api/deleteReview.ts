import { apiFetch } from '~/utils/apiFetch'

export async function deleteReview(reviewId: number) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/reviews/${reviewId}/`,
		{
			method: 'DELETE'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	return response.json()
}
