import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { compareRanked, placeInLine } from '@shared/ordering'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

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
			toast.error('Failed to create section', {
				description: getErrorMessage(error),
			}),
	})
}

export function useUpdateSection() {
	const mutationFn = useConvexMutation(api.sections.update)
	return useMutation({
		mutationFn,
		onError: error =>
			toast.error('Failed to update section', {
				description: getErrorMessage(error),
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

			const { ranks: placed, backfill } = placeInLine(
				sections,
				[sectionId],
				afterId,
			)
			const ranks = new Map(
				[...backfill, ...placed].map(row => [row._id, row.rank]),
			)
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
			toast.error('Failed to move section', {
				description: getErrorMessage(error),
			}),
	})
}

export function useConvertSectionToCollection() {
	const mutationFn = useConvexMutation(api.sections.convertToCollection)
	return useMutation({
		mutationFn,
		onError: error =>
			toast.error('Failed to convert section', {
				description: getErrorMessage(error),
			}),
	})
}

export function useDeleteSection() {
	const mutationFn = useConvexMutation(api.sections.remove)
	return useMutation({
		mutationFn,
		onError: error =>
			toast.error('Failed to delete section', {
				description: getErrorMessage(error),
			}),
	})
}
