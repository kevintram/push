import { apiFetch } from '~/utils/apiFetch'

export async function deleteTopicReview(id: number) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topic-reviews/${id}/`,
		{
			method: 'DELETE'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	return response.json()
}
