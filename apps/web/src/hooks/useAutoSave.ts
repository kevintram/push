import debounce from 'lodash.debounce'
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from 'react'

interface UseAutoSaveOptions {
	/** The initial value to display in the input */
	initialValue: string
	/** Callback invoked after the debounce delay when the value changes */
	onSave: (value: string) => void
	/** Debounce delay in milliseconds. Defaults to 5000ms (5 seconds) */
	debounceMs?: number
	/**
	 * Optional key to identify this auto-save instance. When the key changes,
	 * the local value is reset to initialValue. Useful for resetting state
	 * when switching between different entities (e.g., different topic IDs).
	 */
	key?: string
}

interface UseAutoSaveReturn {
	/** The current local value (updated immediately on user input) */
	value: string
	/** Change handler to attach to input/textarea elements */
	onChange: (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => void
	/** Direct setter for components that don't expose DOM change events */
	setValue: (newValue: string) => void
	/** Immediately run the pending debounced save, if any */
	flush: () => void
}

/**
 * A hook for auto-saving user input with debouncing.
 *
 * This hook manages local state for immediate UI updates while debouncing
 * the actual save operation. It handles the common pattern of editing text
 * fields that auto-save to a backend.
 *
 * ## Features
 * - **Immediate UI updates**: Local state updates instantly for responsive UX
 * - **Debounced saves**: Only calls `onSave` after user stops typing
 * - **Smart resets**: Prevents local changes from being overwritten by external updates
 * - **Stable debouncing**: Works correctly even with unstable `onSave` callbacks
 * - **Key-based reset**: Automatically resets when switching entities
 *
 * ## How it works
 * 1. User types → local `value` updates immediately
 * 2. After debounce delay → `onSave` is called with the latest value
 * 3. External `initialValue` updates are ignored during recent user activity
 * 4. When `key` changes → local value resets to new `initialValue`
 *
 * ## Example usage
 * ```tsx
 * const { mutateAsync: updateNote } = useUpdateNote()
 *
 * const updateNoteContent = useCallback(
 *   (newContent: string) => {
 *     if (!noteId) return
 *     updateNote({ id: noteId, content: newContent })
 *   },
 *   [updateNote, noteId]
 * )
 *
 * const { value, onChange } = useAutoSave({
 *   initialValue: note?.content ?? '',
 *   onSave: updateNoteContent,
 *   debounceMs: 3000,
 *   key: `note-${noteId}`
 * })
 *
 * return <textarea value={value} onChange={onChange} />
 * ```
 *
 * @param options - Configuration options
 * @returns Object with current value and onChange handler
 */
export function useAutoSave({
	initialValue,
	onSave,
	debounceMs = 1000,
	key,
}: UseAutoSaveOptions): UseAutoSaveReturn {
	const [value, setValue] = useState(initialValue)
	const keyRef = useRef<string | undefined>(key)
	const lastUserActionRef = useRef<number | null>(null)

	// Create debounced save function once and reuse it
	// The save callback is provided per change event so pending saves can
	// still target the correct entity after navigation.
	const debouncedSave = useRef(
		debounce((newValue: string, saveFn: (value: string) => void) => {
			saveFn(newValue)
		}, debounceMs),
	).current

	// Flush pending saves during unmount before paint. Using layout cleanup
	// avoids losing edits when users navigate away immediately after typing.
	useLayoutEffect(() => {
		return () => {
			// flush() immediately executes the most recent pending debounced save.
			debouncedSave.flush()
		}
	}, [debouncedSave])

	// Flush pending saves synchronously when key changes, BEFORE paint.
	// This prevents a race condition where the user could type on the new entity
	// before the old entity's edit is saved, which would overwrite the pending save.
	useLayoutEffect(() => {
		if (keyRef.current !== key) {
			debouncedSave.flush()
			keyRef.current = key
			lastUserActionRef.current = null
			setValue(initialValue)
		}
	}, [key, debouncedSave, initialValue])

	// Handle external initialValue updates intelligently (after paint is fine)
	useEffect(() => {
		// Skip if key just changed - useLayoutEffect already handled it
		if (keyRef.current !== key) {
			return
		}

		// Prevent external updates from overwriting recent user changes
		const isRecentUserActivity =
			lastUserActionRef.current !== null &&
			Date.now() - lastUserActionRef.current < debounceMs + 500
		if (isRecentUserActivity) {
			return
		}

		// Safe to update from external source if user hasn't typed recently
		setValue(initialValue)
	}, [initialValue, debounceMs, key])

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			const newValue = e.target.value
			lastUserActionRef.current = Date.now()
			setValue(newValue)
			debouncedSave(newValue, onSave)
		},
		[debouncedSave, onSave],
	)

	const handleValueChange = useCallback(
		(newValue: string) => {
			lastUserActionRef.current = Date.now()
			setValue(newValue)
			debouncedSave(newValue, onSave)
		},
		[debouncedSave, onSave],
	)

	const flush = useCallback(() => {
		debouncedSave.flush()
	}, [debouncedSave])

	return {
		value,
		onChange: handleChange,
		setValue: handleValueChange,
		flush,
	}
}
