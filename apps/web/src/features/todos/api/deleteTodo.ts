import { apiFetch } from '~/utils/apiFetch'

export async function deleteTodo(id: number): Promise<void> {
	await apiFetch(`${import.meta.env.VITE_API_URL}/todos/${id}`, {
		method: 'DELETE'
	})
}
