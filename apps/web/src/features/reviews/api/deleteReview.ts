import { apiFetch } from '~/utils/apiFetch'

export async function deleteReview(id: number): Promise<void> {
	await apiFetch(`${import.meta.env.VITE_API_URL}/reviews/${id}`, {
		method: 'DELETE'
	})
}
