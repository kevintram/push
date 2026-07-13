import debounce from 'lodash.debounce'
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from 'react'

type Save = (value: string) => void

export type UseAutoSaveOptions = {
	initialValue: string
	onSave: Save
	debounceMs?: number
	key?: string
}

export function useAutoSave({
	initialValue,
	onSave,
	debounceMs = 1000,
	key,
}: UseAutoSaveOptions) {
	const [value, setLocalValue] = useState(initialValue)
	const keyRef = useRef(key)
	const lastUserActionRef = useRef<number | null>(null)
	const debouncedSave = useRef(
		debounce((newValue: string, save: Save) => save(newValue), debounceMs),
	).current

	// React may remove a component while a save is still waiting in the queue.
	// Flush it so an edit is not lost just because the editor disappeared.
	useLayoutEffect(
		() => () => {
			debouncedSave.flush()
		},
		[debouncedSave],
	)

	// A key identifies the record being edited. Finish the old record's pending
	// save before replacing the local value with the new one.
	useLayoutEffect(() => {
		if (keyRef.current !== key) {
			debouncedSave.flush()
			keyRef.current = key
			lastUserActionRef.current = null
			setLocalValue(initialValue)
		}
	}, [debouncedSave, initialValue, key])

	// Server updates can arrive shortly after a local edit. Do not let a stale
	// update overwrite what the user is currently typing.
	useEffect(() => {
		if (keyRef.current !== key) return
		const recentlyEdited =
			lastUserActionRef.current !== null &&
			Date.now() - lastUserActionRef.current < debounceMs + 500
		if (!recentlyEdited) setLocalValue(initialValue)
	}, [debounceMs, initialValue, key])

	const scheduleSave = useCallback(
		(newValue: string) => {
			lastUserActionRef.current = Date.now()
			setLocalValue(newValue)
			debouncedSave(newValue, onSave)
		},
		[debouncedSave, onSave],
	)

	const onChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			scheduleSave(event.target.value)
		},
		[scheduleSave],
	)

	const flush = useCallback(() => debouncedSave.flush(), [debouncedSave])

	return { value, onChange, setValue: scheduleSave, flush }
}
