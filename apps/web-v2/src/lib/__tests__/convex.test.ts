import { beforeEach, describe, expect, it, vi } from 'vitest'

const convexState = vi.hoisted(() => ({
	clientOptions: undefined as Record<string, unknown> | undefined,
	clientUrl: undefined as string | undefined,
}))

vi.mock('~/lib/config', () => ({
	config: {
		convex: { url: 'https://example.convex.cloud' },
	},
}))

vi.mock('convex/react', () => ({
	ConvexReactClient: vi.fn(function (
		this: object,
		url: string,
		options?: Record<string, unknown>,
	) {
		convexState.clientUrl = url
		convexState.clientOptions = options
	}),
}))

vi.mock('@convex-dev/react-query', () => ({
	ConvexQueryClient: vi.fn(function () {
		return {
			connect: vi.fn(),
			hashFn: vi.fn(() => vi.fn()),
			queryFn: vi.fn(() => vi.fn()),
		}
	}),
}))

vi.mock('@tanstack/react-query', () => ({
	notifyManager: { setScheduler: vi.fn() },
	QueryClient: vi.fn(),
}))

describe('Convex client configuration', () => {
	beforeEach(() => {
		convexState.clientOptions = undefined
		convexState.clientUrl = undefined
		vi.resetModules()
	})

	it('uses the configured deployment URL with default token handling', async () => {
		await import('../convex')

		expect(convexState.clientUrl).toBe('https://example.convex.cloud')
		expect(convexState.clientOptions).toBeUndefined()
	})
})
