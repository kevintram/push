import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import type {
	CreateChildRelationshipInput,
	CreateParentRelationshipInput,
	CreateRelationshipInput
} from '../types/api.types'
import {
	TopicRelationshipResponseSchema,
	TopicSchema
} from '../types/topic.schemas'
import type { TopicRelationshipResponse } from '../types/topic.types'
import { topicKeys } from './queryKeys'

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
						inboxed: input.child.inboxed,
						srs_enabled: input.child.srs_enabled,
						inherit_fsrs: input.child.inherit_fsrs
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
	let parentId: number

	// If existing parentId provided, use it; otherwise create inline parent
	if ('parentId' in input) {
		parentId = input.parentId
	} else {
		const createResponse = await apiFetch(
			`${import.meta.env.VITE_API_URL}/topics/`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: input.parent.name,
					notes: input.parent.notes,
					archived: input.parent.archived,
					inboxed: input.parent.inboxed,
					srs_enabled: input.parent.srs_enabled,
					inherit_fsrs: input.parent.inherit_fsrs
				})
			}
		)
		if (!createResponse.ok) {
			throw new Error(`API request failed: ${createResponse.status}`)
		}
		const newParent = v.parse(TopicSchema, await createResponse.json())
		parentId = newParent.id
	}

	// Update the child to set parent_id via PATCH
	const patchResponse = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${input.childId}/`,
		{
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ parent_id: parentId })
		}
	)

	if (!patchResponse.ok) {
		throw new Error(`API request failed: ${patchResponse.status}`)
	}

	const updatedChild = v.parse(TopicSchema, await patchResponse.json())

	// Fetch the parent to return the relationship response
	const parentResponse = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${parentId}/`,
		{ method: 'GET' }
	)
	if (!parentResponse.ok) {
		throw new Error(`API request failed: ${parentResponse.status}`)
	}
	const parent = v.parse(TopicSchema, await parentResponse.json())

	return { parent, child: updatedChild }
}

export function useCreateRelationship() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (input: CreateRelationshipInput) => {
			if ('childData' in input) {
				return createChildRelationship({
					parentId: input.parent,
					child: input.childData
				})
			}
			if ('parentData' in input) {
				return createParentRelationship({
					childId: input.child,
					parent: input.parentData
				})
			}
			return createChildRelationship({
				parentId: input.parent,
				childId: input.child
			})
		},
		onSuccess: async data => {
			const parentId = data.parent.id
			const childId = data.child.id

			// Invalidate the detail queries so the single getTopic fetch refreshes with updated relationships
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: topicKeys.detail(parentId)
				}),
				queryClient.invalidateQueries({
					queryKey: topicKeys.detail(childId)
				})
			])
		}
	})
}
