import '@testing-library/jest-dom/vitest'

import { vi } from 'vitest'

// Tests must be runnable from a clean checkout, where worktree-generated env
// files are intentionally absent. These values are public client configuration
// placeholders; individual config tests exercise validation through readConfig.
vi.stubEnv('VITE_CONVEX_URL', 'https://test.convex.cloud')
vi.stubEnv('VITE_CLERK_PUBLISHABLE_KEY', 'pk_test_example')

const localStorageValues = new Map<string, string>()
const testLocalStorage: Storage = {
	get length() {
		return localStorageValues.size
	},
	clear() {
		localStorageValues.clear()
	},
	getItem(key) {
		return localStorageValues.get(key) ?? null
	},
	key(index) {
		return [...localStorageValues.keys()][index] ?? null
	},
	removeItem(key) {
		localStorageValues.delete(key)
	},
	setItem(key, value) {
		localStorageValues.set(key, String(value))
	},
}

// Node's built-in localStorage is unavailable without --localstorage-file,
// while Happy DOM delegates to it in this environment. Install the browser
// contract directly so frontend tests exercise persistence without filesystem
// state or Node runtime warnings.
Object.defineProperty(window, 'localStorage', {
	configurable: true,
	value: testLocalStorage,
})
