import debounce from 'lodash.debounce'
import { useCallback, useEffect, useState } from 'react'

interface UseAutoSaveOptions {
	initialValue: string
	onSave: (value: string) => void
	debounceMs?: number
}
/**
 * A hook that allows you to edit a string value in real time.
 * It debounces the save operation and updates the value in the background.
 * @param initialValue - The initial value of the string.
 * @param onSave - Callback that saves the value to the database.
 * @param debounceMs - The number of milliseconds to debounce the save operation.
 * @returns An object with the current value and a function to update the value.
 */
export function useAutoSave({
	initialValue,
	onSave,
	debounceMs = 1000
}: UseAutoSaveOptions) {
	const [value, setValue] = useState(initialValue)

	useEffect(() => {
		setValue(initialValue)
	}, [initialValue])

	const debouncedSave = useCallback(
		debounce((newValue: string) => {
			onSave(newValue)
		}, debounceMs),
		[]
	)

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			const newValue = e.target.value
			setValue(newValue)
			debouncedSave(newValue)
		},
		[debouncedSave]
	)

	return {
		value,
		onChange: handleChange
	}
}
