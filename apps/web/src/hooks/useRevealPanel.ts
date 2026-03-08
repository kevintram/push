import {
	type Dispatch,
	type SetStateAction,
	useCallback,
	useEffect,
	useRef,
	useState
} from 'react'
import { toast } from 'sonner'
import type { RevealPanelTab } from '~/components/RevealPanel'

export type UseRevealPanelOptions = {
	revealText: string
	entityId: number | null
	hidesSecondary: boolean
	defaultTab?: RevealPanelTab | null
}

type UseRevealPanelResult = {
	revealPanelTab: RevealPanelTab | null
	setRevealPanelTab: Dispatch<SetStateAction<RevealPanelTab | null>>
	guessText: string
	setGuessText: Dispatch<SetStateAction<string>>
	isCopied: boolean
	setIsCopied: Dispatch<SetStateAction<boolean>>
	handleCopyGuessText: () => Promise<void>
	handleCopyRevealText: () => Promise<void>
	reset: () => void
}

export function useRevealPanel({
	revealText,
	entityId,
	hidesSecondary,
	defaultTab = null
}: UseRevealPanelOptions): UseRevealPanelResult {
	const [revealPanelTab, setRevealPanelTab] = useState<RevealPanelTab | null>(
		defaultTab
	)
	const [guessTextState, setGuessTextState] = useState('')
	const [isCopied, setIsCopied] = useState(false)
	const previousEntityIdRef = useRef(entityId)
	const previousHidesSecondaryRef = useRef(hidesSecondary)

	const reset = useCallback(() => {
		setRevealPanelTab(defaultTab)
		setGuessTextState('')
		setIsCopied(false)
	}, [defaultTab])

	const setGuessText = useCallback<Dispatch<SetStateAction<string>>>(value => {
		setGuessTextState(value)
		setIsCopied(false)
	}, [])

	const handleCopyGuessText = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(guessTextState)
			setIsCopied(true)
			toast.success('Guess copied')
		} catch {
			toast.error('Failed to copy guess')
		}
	}, [guessTextState])

	const handleCopyRevealText = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(revealText)
			setIsCopied(true)
			toast.success('Reveal copied')
		} catch {
			toast.error('Failed to copy reveal')
		}
	}, [revealText])

	useEffect(() => {
		if (previousEntityIdRef.current === entityId) return
		previousEntityIdRef.current = entityId
		reset()
	}, [entityId, reset])

	useEffect(() => {
		if (previousHidesSecondaryRef.current === hidesSecondary) return
		previousHidesSecondaryRef.current = hidesSecondary
		reset()
	}, [hidesSecondary, reset])

	useEffect(() => {
		if (!isCopied) return

		const timeoutId = window.setTimeout(() => {
			setIsCopied(false)
		}, 1500)

		return () => {
			window.clearTimeout(timeoutId)
		}
	}, [isCopied])

	return {
		revealPanelTab,
		setRevealPanelTab,
		guessText: guessTextState,
		setGuessText,
		isCopied,
		setIsCopied,
		handleCopyGuessText,
		handleCopyRevealText,
		reset
	}
}
