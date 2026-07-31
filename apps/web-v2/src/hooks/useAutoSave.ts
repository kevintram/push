import debounce from 'lodash.debounce'
import {
	type ChangeEvent,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from 'react'

interface UseAutoSaveOptions {
	/** The latest persisted value received from the owner. */
	initialValue: string
	/** Persists a locally edited value. */
	onSave: (value: string) => Promise<void> | void
	debounceMs?: number
	/** Identifies which record `initialValue` belongs to. */
	key?: string
}

interface UseAutoSaveReturn {
	value: string
	onChange: (
		event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => void
	/** Updates the local value and schedules it to be saved. */
	setValue: (value: string) => void
	/** Immediately runs any save still waiting in the debounce queue. */
	flush: () => void
}

/**
 * Keeps an editable local value synchronized with a persisted value without
 * allowing a delayed server response to overwrite an edit in progress.
 */
export function useAutoSave({
	initialValue,
	onSave,
	debounceMs = 1000,
	key,
}: UseAutoSaveOptions): UseAutoSaveReturn {
	const [value, setValue] = useState(initialValue)

	// `value` belongs to this key. Keeping that association in a ref lets the
	// effects distinguish a new record from a refresh of the current record.
	const keyRef = useRef(key)

	// Server state may echo an older value while a save is in flight. Remember
	// when the user last edited so that echo cannot replace newer local input.
	const lastUserActionRef = useRef<number | null>(null)

	// Keep one debouncer for the lifetime of the hook so renders do not discard
	// its pending timer. The save callback is an argument for the same reason: a
	// queued value uses the callback from the render that scheduled it. As a
	// consequence, debounceMs is configuration and is expected to remain stable.
	const debouncedSave = useRef(
		debounce(
			(
				newValue: string,
				save: (value: string) => Promise<void> | void,
			) => {
				void save(newValue)
			},
			debounceMs,
		),
	).current

	// React may remove the component while a save is still waiting in the queue.
	// Flush it so an edit is not lost just because the editor disappeared.
	useLayoutEffect(
		() => () => {
			debouncedSave.flush()
		},
		[debouncedSave],
	)

	// A key identifies the record being edited. Finish the old record's pending
	// save before replacing the local value with the new record's initial value.
	useLayoutEffect(() => {
		if (keyRef.current === key) return

		debouncedSave.flush()
		keyRef.current = key
		lastUserActionRef.current = null
		setValue(initialValue)
	}, [debouncedSave, initialValue, key])

	// Server updates can arrive shortly after a local edit. Do not let a stale
	// update overwrite what the user is currently typing.
	useEffect(() => {
		if (keyRef.current !== key) return

		// Allow a small grace period beyond the debounce interval for the save and
		// its resulting server refresh to complete.
		const hasRecentUserActivity =
			lastUserActionRef.current !== null &&
			Date.now() - lastUserActionRef.current < debounceMs + 500

		if (!hasRecentUserActivity) setValue(initialValue)
	}, [debounceMs, initialValue, key])

	// This is also exposed as setValue for controls that do not emit a standard
	// input change event. Unlike React's setter, calling it always schedules a save.
	const handleValueChange = useCallback(
		(newValue: string) => {
			lastUserActionRef.current = Date.now()
			setValue(newValue)
			debouncedSave(newValue, onSave)
		},
		[debouncedSave, onSave],
	)

	const handleChange = useCallback(
		(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			handleValueChange(event.target.value)
		},
		[handleValueChange],
	)

	const flush = useCallback(() => {
		debouncedSave.flush()
	}, [debouncedSave])

	return { value, onChange: handleChange, setValue: handleValueChange, flush }
}
