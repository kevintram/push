export type StorageArea = 'local' | 'session'

function getStorage(area: StorageArea): Storage {
	return area === 'local' ? window.localStorage : window.sessionStorage
}

/**
 * Read a stored value, returning `fallback` when the key is missing, holds a
 * value outside `allowed`, or browser storage is unavailable.
 */
export function readStoredValue<T extends string>(
	key: string,
	allowed: ReadonlyArray<T>,
	fallback: T,
	area: StorageArea = 'local',
): T {
	try {
		const value = getStorage(area).getItem(key)
		return allowed.find(option => option === value) ?? fallback
	} catch {
		return fallback
	}
}

/** Store a value, ignoring failures so in-memory state stays usable. */
export function writeStoredValue(
	key: string,
	value: string,
	area: StorageArea = 'local',
): void {
	try {
		getStorage(area).setItem(key, value)
	} catch {
		// Browser storage can be disabled or full; callers keep working in memory.
	}
}

const BOOLEAN_VALUES = ['true', 'false'] as const

export function readStoredBoolean(
	key: string,
	fallback: boolean,
	area: StorageArea = 'local',
): boolean {
	const stored = readStoredValue(
		key,
		BOOLEAN_VALUES,
		fallback ? 'true' : 'false',
		area,
	)
	return stored === 'true'
}

export function writeStoredBoolean(
	key: string,
	value: boolean,
	area: StorageArea = 'local',
): void {
	writeStoredValue(key, String(value), area)
}

/**
 * Read a JSON array of strings, as stored by `writeStoredValue`, returning an empty array when the key
 * is missing, holds anything else, or browser storage is unavailable.
 */
export function readStoredStringArray(
	key: string,
	area: StorageArea = 'local',
): ReadonlyArray<string> {
	try {
		const value: unknown = JSON.parse(getStorage(area).getItem(key) ?? '[]')
		return Array.isArray(value) &&
			value.every(item => typeof item === 'string')
			? value
			: []
	} catch {
		return []
	}
}
