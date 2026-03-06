import debounce from 'lodash.debounce'
import { useEffect, useMemo, useState } from 'react'

/**
 * A hook that debounces a value by a specified delay
 * @param value - The value to debounce
 * @param delay - The debounce delay in milliseconds (default: 300)
 * @returns The debounced value
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value)

	const updateDebouncedValue = useMemo(
		() => debounce((newValue: T) => setDebouncedValue(newValue), delay),
		[delay]
	)

	useEffect(() => {
		updateDebouncedValue(value)
		return () => {
			updateDebouncedValue.cancel()
		}
	}, [value, updateDebouncedValue])

	return debouncedValue
}
