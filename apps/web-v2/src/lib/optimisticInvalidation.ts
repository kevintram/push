import {
	partialMatchKey,
	type QueryClient,
	type QueryKey,
} from '@tanstack/react-query'

import { optimisticMutationKeys } from './mutationConfig'

type BatchState = {
	pending: Map<string, QueryKey>
	deleted: Array<QueryKey>
	scheduled: boolean
}

const stateByClient = new WeakMap<QueryClient, BatchState>()

function getBatchState(queryClient: QueryClient): BatchState {
	const existing = stateByClient.get(queryClient)
	if (existing) return existing

	const created: BatchState = {
		pending: new Map(),
		deleted: [],
		scheduled: false,
	}
	stateByClient.set(queryClient, created)
	return created
}

function flush(queryClient: QueryClient, state: BatchState): void {
	const roots = [...state.pending.values()]
	const deleted = [...state.deleted]
	state.pending.clear()
	state.deleted.length = 0

	for (const queryKey of roots) {
		void queryClient.invalidateQueries({
			queryKey,
			predicate: query =>
				!deleted.some(deletedKey =>
					partialMatchKey(query.queryKey, deletedKey),
				),
		})
	}
}

/**
 * Record query keys whose records no longer exist on the server so the batch
 * invalidation never refetches them.
 *
 * A mounted query for a deleted record cannot be removed without its observer
 * immediately refetching, and that refetch 404s into the error boundary. Such
 * queries are left alone instead: stale until the route unmounts them.
 */
export function excludeDeletedFromOptimisticBatch(
	queryClient: QueryClient,
	queryKeys: Array<QueryKey>,
): void {
	getBatchState(queryClient).deleted.push(...queryKeys)
}

/**
 * Queue query roots to be invalidated once every optimistic mutation has
 * settled, so one mutation's refetch cannot overwrite another's pending
 * optimistic state.
 *
 * Never awaits the invalidation. Query-core awaits `onSettled` before it
 * dispatches success, so awaiting here would both keep the mutation `pending`
 * for the duration of its own refetch and delay the caller's `onSuccess` by an
 * extra round trip.
 */
export function invalidateAfterOptimisticBatch(
	queryClient: QueryClient,
	queryKeys: Array<QueryKey>,
): void {
	const state = getBatchState(queryClient)
	for (const queryKey of queryKeys) {
		state.pending.set(JSON.stringify(queryKey), queryKey)
	}

	if (state.scheduled) return
	state.scheduled = true

	// A macrotask runs after every mutation settling in this tick has
	// dispatched, so `isMutating` then reflects only requests still in flight.
	// Checking synchronously would instead count mutations that are mid-settle,
	// and their queued roots would never be flushed by anyone.
	setTimeout(() => {
		state.scheduled = false
		if (
			queryClient.isMutating({ mutationKey: optimisticMutationKeys.all })
		) {
			// Whoever is still in flight re-schedules this flush on settle.
			return
		}
		flush(queryClient, state)
	}, 0)
}
