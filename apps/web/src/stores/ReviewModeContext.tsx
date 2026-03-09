import { useRouterState } from '@tanstack/react-router'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const FLASHCARD_MODE_STORAGE_KEY = '3gulp-flashcard-mode'

export const REVIEW_MODES = ['off', 'on'] as const

export type ReviewMode = (typeof REVIEW_MODES)[number]

type ReviewModeContextType = {
	reviewMode: ReviewMode
	setReviewMode: (mode: ReviewMode) => void
	isReviewModeEnabled: boolean
	hidesPrimary: boolean
	hidesSecondary: boolean
}

const ReviewModeContext = createContext<ReviewModeContextType | undefined>(
	undefined
)

interface ReviewModeProviderProps {
	children: React.ReactNode
}

function isForcedReviewModePath(pathname: string): boolean {
	return pathname === '/practice' || pathname === '/flashcards'
}

function isReviewMode(value: string): value is ReviewMode {
	return REVIEW_MODES.includes(value as ReviewMode)
}

function getInitialReviewMode(): ReviewMode {
	if (typeof window === 'undefined') return 'off'

	const storage = window.localStorage
	if (!storage || typeof storage.getItem !== 'function') return 'off'

	const storedValue = storage.getItem(FLASHCARD_MODE_STORAGE_KEY)
	if (!storedValue) return 'off'

	// Backwards-compatibility for prior boolean persistence.
	if (storedValue === 'true') return 'on'
	if (storedValue === 'false') return 'off'
	if (storedValue === 'hide_answers_only') return 'on'
	if (storedValue === 'hide_everything') return 'on'

	return isReviewMode(storedValue) ? storedValue : 'off'
}

export function ReviewModeProvider({ children }: ReviewModeProviderProps) {
	const pathname = useRouterState({
		select: state => state.location.pathname
	})
	const [storedReviewMode, setStoredReviewMode] =
		useState<ReviewMode>(getInitialReviewMode)
	const onForcedPath = isForcedReviewModePath(pathname)
	const reviewMode = onForcedPath ? 'on' : storedReviewMode

	// Persist 'on' when a forced-review path activates review mode so it
	// survives navigation to other pages.
	useEffect(() => {
		if (onForcedPath && storedReviewMode !== 'on') {
			setStoredReviewMode('on')
		}
	}, [onForcedPath, storedReviewMode])

	useEffect(() => {
		const storage = window.localStorage
		if (!storage || typeof storage.setItem !== 'function') return

		storage.setItem(FLASHCARD_MODE_STORAGE_KEY, storedReviewMode)
	}, [storedReviewMode])

	const value = useMemo(
		() => ({
			reviewMode,
			setReviewMode: setStoredReviewMode,
			isReviewModeEnabled: reviewMode !== 'off',
			hidesPrimary: false,
			hidesSecondary: reviewMode !== 'off'
		}),
		[reviewMode]
	)

	return <ReviewModeContext value={value}>{children}</ReviewModeContext>
}

export function useReviewMode() {
	const context = useContext(ReviewModeContext)

	if (!context) {
		// biome-ignore lint/nursery/noSecrets: false positive on static invariant message
		throw new Error('ReviewModeProvider is required')
	}

	return context
}
