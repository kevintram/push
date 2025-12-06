import * as v from 'valibot'
import {
	type TopicRelationshipResponse,
	TopicRelationshipResponseSchema
} from '~/models/review-topic.types'
import { apiFetch } from '~/utils/apiFetch'

type CreateChildRelationshipInput =
	| {
			parentId: number
			childId: number
	  }
	| {
			parentId: number
			child: {
				name: string
				notes: string
				archived: boolean
				inboxed: boolean
			}
	  }

type CreateParentRelationshipInput =
	| {
			childId: number
			parentId: number
	  }
	| {
			childId: number
			parent: {
				name: string
				notes: string
				archived: boolean
				inboxed: boolean
			}
	  }

export async function createChildRelationship(
	input: CreateChildRelationshipInput
): Promise<TopicRelationshipResponse> {
	const body =
		'childId' in input
			? { child_id: input.childId }
			: {
					child: {
						name: input.child.name,
						notes: input.child.notes,
						archived: input.child.archived,
						inboxed: input.child.inboxed
					}
				}

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${input.parentId}/children/`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(TopicRelationshipResponseSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export async function createParentRelationship(
	input: CreateParentRelationshipInput
): Promise<TopicRelationshipResponse> {
	const body =
		'parentId' in input
			? { parent_id: input.parentId }
			: {
					parent: {
						name: input.parent.name,
						notes: input.parent.notes,
						archived: input.parent.archived,
						inboxed: input.parent.inboxed
					}
				}

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${input.childId}/parents/`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(TopicRelationshipResponseSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}
