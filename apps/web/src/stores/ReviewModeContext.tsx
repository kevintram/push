import { useRouterState } from '@tanstack/react-router'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const FLASHCARD_MODE_STORAGE_KEY = '3gulp-flashcard-mode'
const REVIEW_MODE_WARNING_STORAGE_KEY = '3gulp-review-mode-warning'
const REVIEW_MODE_AUTO_ENABLE_STORAGE_KEY = '3gulp-review-mode-auto-enable'

export const REVIEW_MODES = ['off', 'on'] as const

export type ReviewMode = (typeof REVIEW_MODES)[number]

interface ReviewModeContextType {
	reviewMode: ReviewMode
	setReviewMode: (mode: ReviewMode) => void
	isReviewModeEnabled: boolean
	hidesPrimary: boolean
	hidesSecondary: boolean
	showReviewModeWarning: boolean
	setShowReviewModeWarning: (value: boolean) => void
	autoEnableReviewMode: boolean
	setAutoEnableReviewMode: (value: boolean) => void
}

const ReviewModeContext = createContext<ReviewModeContextType | undefined>(
	undefined
)

interface ReviewModeProviderProps {
	children: React.ReactNode
}

function isForcedReviewModePath(pathname: string): boolean {
	return (
		pathname === '/practice' ||
		pathname === '/flashcards' ||
		pathname === '/due/focus' ||
		pathname.startsWith('/due/focus/')
	)
}

function isReviewMode(value: string): value is ReviewMode {
	return REVIEW_MODES.includes(value as ReviewMode)
}

function getStoredBoolean(key: string, fallback: boolean): boolean {
	if (typeof window === 'undefined') return fallback

	const storage = window.localStorage
	if (!storage || typeof storage.getItem !== 'function') return fallback

	const storedValue = storage.getItem(key)
	if (storedValue === null) return fallback

	return storedValue === 'true'
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
	const [reviewMode, setReviewMode] = useState<ReviewMode>(() =>
		isForcedReviewModePath(pathname) ? 'on' : getInitialReviewMode()
	)
	const [showReviewModeWarning, setShowReviewModeWarning] = useState(() =>
		getStoredBoolean(REVIEW_MODE_WARNING_STORAGE_KEY, true)
	)
	const [autoEnableReviewMode, setAutoEnableReviewMode] = useState(() =>
		getStoredBoolean(REVIEW_MODE_AUTO_ENABLE_STORAGE_KEY, false)
	)

	// Auto-enable review mode when navigating to a forced path.
	useEffect(() => {
		if (isForcedReviewModePath(pathname)) {
			setReviewMode('on')
		}
	}, [pathname])

	useEffect(() => {
		const storage = window.localStorage
		if (!storage || typeof storage.setItem !== 'function') return

		storage.setItem(FLASHCARD_MODE_STORAGE_KEY, reviewMode)
		storage.setItem(
			REVIEW_MODE_WARNING_STORAGE_KEY,
			String(showReviewModeWarning)
		)
		storage.setItem(
			REVIEW_MODE_AUTO_ENABLE_STORAGE_KEY,
			String(autoEnableReviewMode)
		)
	}, [reviewMode, showReviewModeWarning, autoEnableReviewMode])

	const value = useMemo(
		() => ({
			reviewMode,
			setReviewMode,
			isReviewModeEnabled: reviewMode !== 'off',
			hidesPrimary: false,
			hidesSecondary: reviewMode !== 'off',
			showReviewModeWarning,
			setShowReviewModeWarning,
			autoEnableReviewMode,
			setAutoEnableReviewMode
		}),
		[reviewMode, showReviewModeWarning, autoEnableReviewMode]
	)

	return <ReviewModeContext value={value}>{children}</ReviewModeContext>
}

export function useReviewMode() {
	const context = useContext(ReviewModeContext)

	if (!context) {
		// biome-ignore lint/security/noSecrets: false positive on static invariant message
		throw new Error('ReviewModeProvider is required')
	}

	return context
}
