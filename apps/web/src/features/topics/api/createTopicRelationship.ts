import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { reviewKeys } from '~/features/reviews/api/queryKeys'
import {
	type TopicRelationshipResponse,
	TopicRelationshipResponseSchema
} from '~/models/review-topic.types'
import { apiFetch } from '~/utils/apiFetch'
import type {
	CreateChildRelationshipInput,
	CreateParentRelationshipInput,
	CreateRelationshipInput
} from '../types/api.types'
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
		onSuccess: async () => {
			// Invalidate topic and review caches
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: topicKeys.all }),
				queryClient.invalidateQueries({ queryKey: reviewKeys.all })
			])

			// Invalidate potential relationships cache since the graph has changed
			await queryClient.invalidateQueries({
				queryKey: ['potential-children']
			})
			await queryClient.invalidateQueries({
				queryKey: ['potential-parents']
			})
		}
	})
}
