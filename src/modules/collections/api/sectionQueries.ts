import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import type { Section } from '@convex/validators/sections'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { compareRanked, placeInLine } from '@shared/ordering'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { toast, toastError, toastName, toastTitle } from '~/components/ui/Toast'

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
	const convert = useConvexMutation(api.sections.convertToCollection)
	return useMutation({
		mutationFn: ({ sections }: { sections: ReadonlyArray<Section> }) =>
			convert({ sectionIds: sections.map(section => section._id) }),
		onError: (error, { sections }) =>
			toastError(
				sections.length > 1
					? 'Failed to convert sections'
					: 'Failed to convert section',
				error,
			),
		onSuccess: (collectionIds, { sections }) => {
			const [collectionId] = collectionIds
			const [section] = sections
			if (collectionId === undefined || section === undefined) return
			if (collectionIds.length > 1) {
				toast.add({
					title: `Converted ${collectionIds.length} sections to subcollections`,
					type: 'success',
				})
				return
			}

			toast.add({
				data: {
					open: {
						label: 'Open',
						onClick: () =>
							void navigate({
								to: '/collection/$collectionId',
								params: { collectionId },
							}),
					},
				},
				title: toastTitle(
					'Converted ',
					toastName(section.title, 'Untitled section'),
					' to a subcollection',
				),
				type: 'success',
			})
		},
	})
}
