import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '~/stores/ThemeContext'
import './global.css'
import { routeTree } from './routeTree.gen'

// in dev mode, append port and git branch to document title for quick context
if (import.meta.env.DEV && !import.meta.env.VITEST) {
	const branchLabel =
		// biome-ignore lint/correctness/noUndeclaredVariables: __APP_BRANCH__ is defined in vite.config.ts
		typeof __APP_BRANCH__ === 'string' && __APP_BRANCH__.length > 0
			? // biome-ignore lint/correctness/noUndeclaredVariables: __APP_BRANCH__ is defined in vite.config.ts
				__APP_BRANCH__
			: ''
	if (!document.title.includes(branchLabel)) {
		document.title = `${document.title} ${branchLabel}`.trim()
	}
}

// Create router instance
const router = createRouter({ routeTree })
// Declare route type
declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}

const queryClient = new QueryClient()

async function enableMocking() {
	if (import.meta.env.VITE_ENABLE_MSW_TESTS !== 'development') {
		return
	}
	const { worker } = await import('./__mocks__/browser')
	return worker.start()
}

const container = document.querySelector('#root')
enableMocking()
	.then(() => {
		if (container) {
			const root = createRoot(container)
			root.render(
				<StrictMode>
					<ThemeProvider defaultTheme='system' storageKey='vite-ui-theme'>
						<QueryClientProvider client={queryClient}>
							<ReactQueryDevtools initialIsOpen={false} />
							<RouterProvider router={router} />
						</QueryClientProvider>
					</ThemeProvider>
				</StrictMode>
			)
		}
	})
	.catch(error => {
		alert(`Failed to enable mocking: ${error}`)
	})
