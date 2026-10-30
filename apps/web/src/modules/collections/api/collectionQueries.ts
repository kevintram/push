import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'
import { useMatchRoute, useNavigate } from '@tanstack/react-router'

import { toastError, toastUndo } from '~/components/ui/Toast'

// `expandPath` decides whether `path` holds ancestor ids or the documents they
// name. It is a runtime argument, so `path` is typed as the union of both;
// callers that pass `expandPath: true` cast `path` to `Array<Collection>`. The two
// values are distinct Convex cache entries, so a caller wanting both shapes
// subscribes twice.
export const collectionQueries = {
	list: () => convexQuery(api.collections.list, {}),
	children: (collectionId: Id<'collections'>) =>
		convexQuery(api.collections.listChildren, { collectionId }),
	search: (query: string) => convexQuery(api.collections.search, { query }),
	detail: (
		collectionId: Id<'collections'>,
		{ expandPath }: { expandPath: boolean },
	) => convexQuery(api.collections.get, { expandPath, collectionId }),
}

export function useCreateCollection() {
	const mutationFn = useConvexMutation(api.collections.create)
	return useMutation({
		mutationFn,
		onError: error => toastError('Failed to create collection', error),
	})
}

export function useUpdateCollection() {
	const mutationFn = useConvexMutation(api.collections.update)
	return useMutation({
		mutationFn,
		onError: error => toastError('Failed to update collection', error),
	})
}

type CollectionMove = {
	collectionId: Id<'collections'>
	/** The new parent, or `null` for the root. */
	parentId: Id<'collections'> | null
	/** The parent it leaves, so the move can be undone. */
	fromParentId: Id<'collections'> | null
}

/** Moves a collection under another parent, offering to undo it. */
export function useMoveCollection() {
	const update = useConvexMutation(api.collections.update)
	return useMutation({
		mutationFn: ({ collectionId, parentId }: CollectionMove) =>
			update({ collectionId, parentId }),
		onError: error => toastError('Failed to move collection', error),
		onSuccess: (_, { collectionId, fromParentId }) =>
			toastUndo('Moved collection', () =>
				update({ collectionId, parentId: fromParentId }),
			),
	})
}

export function useDeleteCollection() {
	const navigate = useNavigate()
	const matchRoute = useMatchRoute()

	const mutationFn = useConvexMutation(api.collections.remove)

	return useMutation({
		mutationFn,
		onError: error => toastError('Failed to delete collection', error),
		onSuccess: ({ _id, parentId }) => {
			// if deleted collection is currently open
			if (
				matchRoute({
					to: '/collection/$collectionId',
					params: { collectionId: _id },
				})
			) {
				// navigate to parent if has one, review otherwise
				void navigate(
					parentId !== undefined
						? {
								to: '/collection/$collectionId',
								params: { collectionId: parentId },
							}
						: { to: '/review' },
				)
			}
		},
	})
}
