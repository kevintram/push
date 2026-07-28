import { useMutation, useQueryClient } from '@tanstack/react-query'

import { mutationScopes, optimisticMutationKeys } from '~/lib/mutationConfig'
import {
	combineRollbacks,
	type OptimisticContext,
	type Rollback,
} from '~/lib/optimistic'
import { invalidateAfterOptimisticBatch } from '~/lib/optimisticInvalidation'
import { apiFetch } from '~/utils/apiFetch'

import { TopicSchema } from '../types/topic.schemas'
import type { Topic, TopicWithChildren } from '../types/topic.types'
import { topicQueries } from './queries'

export type UpdateTopicInput = {
	id: string
	title?: string
	body?: string
}

export async function updateTopic({
	id,
	...updates
}: UpdateTopicInput): Promise<Topic> {
	return apiFetch(TopicSchema, `/topics/${id}/`, {
		method: 'PATCH',
		body: updates,
	})
}

type TopicChanges = Partial<Pick<Topic, 'body' | 'title'>>

function patchTopicTree(
	topics: Array<TopicWithChildren>,
	id: string,
	changes: TopicChanges,
): Array<TopicWithChildren> {
	return topics.map(topic => ({
		...topic,
		...(topic.id === id ? changes : {}),
		children: topic.children
			? patchTopicTree(topic.children, id, changes)
			: topic.children,
	}))
}

function findTopic(
	topics: Array<TopicWithChildren>,
	id: string,
): TopicWithChildren | undefined {
	for (const topic of topics) {
		if (topic.id === id) return topic
		const match = topic.children ? findTopic(topic.children, id) : undefined
		if (match) return match
	}
}

export function useUpdateTopic() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationKey: [...optimisticMutationKeys.topics, 'update'],
		scope: mutationScopes.topics,
		mutationFn: updateTopic,
		meta: { errorMessage: 'Failed to update topic' },
		onMutate: async ({ id, ...updates }): Promise<OptimisticContext> => {
			await queryClient.cancelQueries({ queryKey: topicQueries.all })

			const changes: TopicChanges = {
				...('title' in updates ? { title: updates.title } : {}),
				...('body' in updates ? { body: updates.body } : {}),
			}
			const rollbacks: Array<Rollback> = []
			const detailKey = topicQueries.detail(id).queryKey
			const detail = queryClient.getQueryData<Topic>(detailKey)
			if (detail) {
				const previous: TopicChanges = {
					...('title' in changes ? { title: detail.title } : {}),
					...('body' in changes ? { body: detail.body } : {}),
				}
				queryClient.setQueryData<Topic>(detailKey, {
					...detail,
					...changes,
				})
				rollbacks.push(() => {
					queryClient.setQueryData<Topic>(detailKey, current =>
						current?.id === id
							? { ...current, ...previous }
							: current,
					)
				})
			}

			for (const [queryKey, topics] of queryClient.getQueriesData<
				Array<TopicWithChildren>
			>({ queryKey: topicQueries.lists() })) {
				const topic = topics && findTopic(topics, id)
				if (!topics || !topic) continue
				const previous: TopicChanges = {
					...('title' in changes ? { title: topic.title } : {}),
					...('body' in changes ? { body: topic.body } : {}),
				}
				queryClient.setQueryData(
					queryKey,
					patchTopicTree(topics, id, changes),
				)
				rollbacks.push(() => {
					queryClient.setQueryData<Array<TopicWithChildren>>(
						queryKey,
						current =>
							current && findTopic(current, id)
								? patchTopicTree(current, id, previous)
								: current,
					)
				})
			}

			return { rollback: combineRollbacks(rollbacks) }
		},
		onError: (_error, _updates, context) => context?.rollback(),
		onSettled: () =>
			invalidateAfterOptimisticBatch(queryClient, [topicQueries.all]),
	})
}
