import * as v from 'valibot'
import { TopicSchema } from '~/models/todo-topic.types'
import { apiFetch } from '~/utils/apiFetch'

type CreateChildRelationshipInput = {
	parentId: number
	childId: number
}

type CreateParentRelationshipInput = {
	childId: number
	parentId: number
}

export async function createChildRelationship(
	input: CreateChildRelationshipInput
) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${input.parentId}/children/`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				child_id: input.childId
			})
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	return v.parse(TopicSchema, data)
}

export async function createParentRelationship(
	input: CreateParentRelationshipInput
) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${input.childId}/parents/`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				parent_id: input.parentId
			})
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	return v.parse(TopicSchema, data)
}
