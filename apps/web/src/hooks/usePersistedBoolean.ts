import { useCallback, useState } from 'react'

import {
	readStoredBoolean,
	type StorageArea,
	writeStoredBoolean,
} from '~/utils/storage'

/**
 * Boolean state that starts from browser storage and writes every update
 * back to it.
 */
export function usePersistedBoolean(
	key: string,
	fallback: boolean,
	area: StorageArea = 'local',
) {
	const [value, setValue] = useState(() =>
		readStoredBoolean(key, fallback, area),
	)

	const setPersistedValue = useCallback(
		(nextValue: boolean) => {
			setValue(nextValue)
			writeStoredBoolean(key, nextValue, area)
		},
		[key, area],
	)

	return [value, setPersistedValue] as const
}
