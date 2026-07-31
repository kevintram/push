import '@testing-library/jest-dom/vitest'

import { vi } from 'vitest'

// Tests must be runnable from a clean checkout, where worktree-generated env
// files are intentionally absent. These values are public client configuration
// placeholders; individual config tests exercise validation through readConfig.
vi.stubEnv('VITE_CONVEX_URL', 'https://test.convex.cloud')
vi.stubEnv('VITE_WORKOS_CLIENT_ID', 'client_test')
vi.stubEnv('VITE_WORKOS_REDIRECT_URI', 'http://localhost:6173/')
vi.stubEnv('VITE_WORKOS_SIGN_OUT_RETURN_TO', 'http://localhost:6173/')
