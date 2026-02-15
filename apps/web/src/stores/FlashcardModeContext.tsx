import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const FLASHCARD_MODE_STORAGE_KEY = '3gulp-flashcard-mode'

export const REVIEW_MODES = [
	'off',
	'hide_answers_only',
	'hide_everything'
] as const

export type ReviewMode = (typeof REVIEW_MODES)[number]

type FlashcardModeContextType = {
	reviewMode: ReviewMode
	setReviewMode: (mode: ReviewMode) => void
	isReviewModeEnabled: boolean
	hidesPrimary: boolean
	hidesSecondary: boolean
}

const FlashcardModeContext = createContext<
	FlashcardModeContextType | undefined
>(undefined)

interface FlashcardModeProviderProps {
	children: React.ReactNode
}

function isReviewMode(value: string): value is ReviewMode {
	return REVIEW_MODES.includes(value as ReviewMode)
}

function getInitialReviewMode(): ReviewMode {
	if (typeof window === 'undefined') return 'off'

	const storedValue = window.localStorage.getItem(FLASHCARD_MODE_STORAGE_KEY)
	if (!storedValue) return 'off'

	// Backwards-compatibility for prior boolean persistence.
	if (storedValue === 'true') return 'hide_everything'
	if (storedValue === 'false') return 'off'

	return isReviewMode(storedValue) ? storedValue : 'off'
}

export function FlashcardModeProvider({
	children
}: FlashcardModeProviderProps) {
	const [reviewMode, setReviewMode] = useState<ReviewMode>(getInitialReviewMode)

	useEffect(() => {
		window.localStorage.setItem(FLASHCARD_MODE_STORAGE_KEY, reviewMode)
	}, [reviewMode])

	const value = useMemo(
		() => ({
			reviewMode,
			setReviewMode,
			isReviewModeEnabled: reviewMode !== 'off',
			hidesPrimary: reviewMode === 'hide_everything',
			hidesSecondary: reviewMode !== 'off'
		}),
		[reviewMode]
	)

	return <FlashcardModeContext value={value}>{children}</FlashcardModeContext>
}

export function useFlashcardMode() {
	const context = useContext(FlashcardModeContext)

	if (!context) {
		throw new Error('FlashcardModeProvider is required')
	}

	return context
}
