import './global.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { routeTree } from './routeTree.gen'

// if dev environment, append '(dev)' to document title
if (import.meta.env.DEV && !import.meta.env.VITEST) {
	document.title = `${document.title} (dev)`
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
	// TODO: uncomment this line
	// if (process.env.NODE_ENV !== 'development') {
	//   return
	// }
	const { worker } = await import('./mocks/browser')
	return worker.start()
}

const container = document.querySelector('#root')
enableMocking()
	.then(() => {
		if (container) {
			const root = createRoot(container)
			root.render(
				<StrictMode>
					<QueryClientProvider client={queryClient}>
						<ReactQueryDevtools initialIsOpen={false} />
						<RouterProvider router={router} />
					</QueryClientProvider>
				</StrictMode>
			)
		}
	})
	.catch(error => {
		alert(`Failed to enable mocking: ${error}`)
	})
