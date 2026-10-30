import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { compareRanked, placeInLine } from '@shared/ordering'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { toast, toastError } from '~/components/ui/Toast'

export const sectionQueries = {
	listByCollection: (collectionId: Id<'collections'>) =>
		convexQuery(api.sections.listByCollection, { collectionId }),
}

export function useCreateSection() {
	const mutationFn = useConvexMutation(api.sections.create)
	return useMutation({
		mutationFn,
		onError: error => toastError('Failed to create section', error),
	})
}

export function useUpdateSection() {
	const mutationFn = useConvexMutation(api.sections.update)
	return useMutation({
		mutationFn,
		onError: error => toastError('Failed to update section', error),
	})
}

/** Reorders sections, showing their new place before the server confirms it. */
export function useMoveSections() {
	const mutationFn = useConvexMutation(
		api.sections.move,
	).withOptimisticUpdate((localStore, { sectionIds, afterId }) => {
		for (const { args, value: sections } of localStore.getAllQueries(
			api.sections.listByCollection,
		)) {
			const ids = new Set(sections?.map(section => section._id))
			if (!sections || !sectionIds.every(id => ids.has(id))) continue
			// The server rejects the move, so there is nothing to show.
			if (afterId !== null && !ids.has(afterId)) continue

			const { ranks: placed, backfill } = placeInLine(
				sections,
				sectionIds,
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
		onError: error => toastError('Failed to move section', error),
	})
}

/**
 * Turns sections into subcollections, confirming it since their cards leave
 * the page. A single new subcollection gets a button to open it.
 */
export function useConvertSectionsToCollections() {
	const navigate = useNavigate()
	const mutationFn = useConvexMutation(api.sections.convertToCollection)
	return useMutation({
		mutationFn,
		onError: (error, { sectionIds }) =>
			toastError(
				sectionIds.length > 1
					? 'Failed to convert sections'
					: 'Failed to convert section',
				error,
			),
		onSuccess: collectionIds => {
			const [collectionId] = collectionIds
			if (collectionId === undefined) return
			if (collectionIds.length > 1) {
				toast.add({
					title: `Converted ${collectionIds.length} sections to subcollections`,
					type: 'success',
				})
				return
			}

			const id = toast.add({
				actionProps: {
					children: 'Open',
					onClick: () => {
						toast.close(id)
						void navigate({
							to: '/collection/$collectionId',
							params: { collectionId },
						})
					},
				},
				title: 'Converted to subcollection',
				type: 'success',
			})
		},
	})
}
