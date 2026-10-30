import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { compareRanked, placeInLine } from '@shared/ordering'
import { useMutation } from '@tanstack/react-query'

import { toast } from '~/components/ui/Toast'
import { getErrorMessage } from '~/utils/error'

export const sectionQueries = {
	listByCollection: (collectionId: Id<'collections'>) =>
		convexQuery(api.sections.listByCollection, { collectionId }),
}

export function useCreateSection() {
	const mutationFn = useConvexMutation(api.sections.create)
	return useMutation({
		mutationFn,
		onError: error =>
			toast.add({
				description: getErrorMessage(error),
				title: 'Failed to create section',
				type: 'error',
			}),
	})
}

export function useUpdateSection() {
	const mutationFn = useConvexMutation(api.sections.update)
	return useMutation({
		mutationFn,
		onError: error =>
			toast.add({
				description: getErrorMessage(error),
				title: 'Failed to update section',
				type: 'error',
			}),
	})
}

/** Reorders a section, showing its new place before the server confirms it. */
export function useMoveSection() {
	const mutationFn = useConvexMutation(
		api.sections.move,
	).withOptimisticUpdate((localStore, { sectionId, afterId }) => {
		for (const { args, value: sections } of localStore.getAllQueries(
			api.sections.listByCollection,
		)) {
			const ids = new Set(sections?.map(section => section._id))
			if (!sections || !ids.has(sectionId)) continue
			// The server rejects the move, so there is nothing to show.
			if (afterId !== null && !ids.has(afterId)) continue

			const { rank, backfill } = placeInLine(sections, sectionId, afterId)
			const ranks = new Map([
				...backfill.map(row => [row._id, row.rank] as const),
				[sectionId, rank],
			])
			localStore.setQuery(
				api.sections.listByCollection,
				args,
				sections
					.map(section => {
						const placed = ranks.get(section._id)
						return placed ? { ...section, rank: placed } : section
					})
					.sort(compareRanked),
			)
		}
	})
	return useMutation({
		mutationFn,
		onError: error =>
			toast.add({
				description: getErrorMessage(error),
				title: 'Failed to move section',
				type: 'error',
			}),
	})
}

export function useDeleteSection() {
	const mutationFn = useConvexMutation(api.sections.remove)
	return useMutation({
		mutationFn,
		onError: error =>
			toast.add({
				description: getErrorMessage(error),
				title: 'Failed to delete section',
				type: 'error',
			}),
	})
}
