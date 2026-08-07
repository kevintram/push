import '@testing-library/jest-dom/vitest'

import { vi } from 'vitest'

// Tests must be runnable from a clean checkout, where worktree-generated env
// files are intentionally absent. These values are public client configuration
// placeholders; individual config tests exercise validation through readConfig.
vi.stubEnv('VITE_CONVEX_URL', 'https://test.convex.cloud')
vi.stubEnv('VITE_CLERK_PUBLISHABLE_KEY', 'pk_test_example')
