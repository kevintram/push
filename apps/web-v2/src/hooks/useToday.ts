import { DateTime } from 'luxon'
import { useSyncExternalStore } from 'react'

import type { DateString } from '~/types/date'
import { todayIso } from '~/utils/date'

// Reading todayIso() during render would not make mounted UI update at midnight.
// This module-wide store makes the local day reactive while sharing one timer
// and one set of browser lifecycle listeners across every hook instance.
const listeners = new Set<() => void>()
let currentToday = todayIso()
let timeoutId: ReturnType<typeof setTimeout> | undefined

/** Return the user's current local calendar day, including in long-lived tabs. */
export function useToday(): DateString {
	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

function subscribe(listener: () => void) {
	listeners.add(listener)
	// The first subscriber owns the browser integration. The last subscriber's
	// cleanup below must undo everything initialized here.
	if (listeners.size === 1) {
		refresh()
		window.addEventListener('focus', refresh)
		window.addEventListener('pageshow', refresh)
		document.addEventListener('visibilitychange', refreshWhenVisible)
	}

	return () => {
		listeners.delete(listener)
		if (listeners.size !== 0) return

		if (timeoutId !== undefined) clearTimeout(timeoutId)
		timeoutId = undefined
		window.removeEventListener('focus', refresh)
		window.removeEventListener('pageshow', refresh)
		document.removeEventListener('visibilitychange', refreshWhenVisible)
	}
}

function refresh() {
	// Always derive the day from the clock. Timers may run late after sleep,
	// throttling, or a timezone change, so advancing the cached date is unsafe.
	const now = DateTime.now()
	const nextToday = todayIso(now)
	if (nextToday !== currentToday) {
		currentToday = nextToday
		for (const listener of [...listeners]) listener()
	}

	// A listener may synchronously unsubscribe while handling the update. Do not
	// let that refresh recreate a timer after the store has become inactive.
	if (listeners.size > 0) scheduleNextMidnight(now)
}

function scheduleNextMidnight(now: DateTime) {
	if (timeoutId !== undefined) clearTimeout(timeoutId)

	// Luxon performs calendar arithmetic in the active local zone. This keeps
	// the timer aligned with local midnight across 23- and 25-hour DST days.
	const nextMidnight = now.plus({ days: 1 }).startOf('day')
	const delay = Math.max(0, nextMidnight.diff(now).milliseconds)

	// The small buffer avoids firing on the old day because of timer precision
	// around the exact midnight boundary.
	timeoutId = setTimeout(refresh, delay + 100)
}

function refreshWhenVisible() {
	if (document.visibilityState === 'visible') refresh()
}

function getSnapshot() {
	return currentToday
}
