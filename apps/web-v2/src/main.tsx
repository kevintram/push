import './styles/global.css'

import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { LoaderPage } from './app/pages/LoaderPage'
import { routeTree } from './app/routeTree.gen'
import { TooltipProvider } from './components/ui'
import { AuthProvider } from './stores/Auth/AuthProvider'
import { HideModeProvider } from './stores/HideMode'

if (import.meta.env.DEV && !import.meta.env.VITEST) {
	const branchLabel = __APP_BRANCH__
	if (branchLabel.length > 0 && !document.title.includes(branchLabel)) {
		document.title = `${document.title} ${branchLabel}`.trim()
	}
}

const router = createRouter({
	routeTree,

	defaultPreload: 'intent',
	defaultPreloadStaleTime: 0,

	defaultPendingComponent: LoaderPage,
	defaultPendingMs: 200,
	defaultPendingMinMs: 200,

	scrollRestoration: true,
})

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}

const container = document.querySelector('#root')

if (container) {
	createRoot(container).render(
		<StrictMode>
			<AuthProvider>
				<TooltipProvider>
					<HideModeProvider>
						<RouterProvider router={router} />
					</HideModeProvider>
				</TooltipProvider>
			</AuthProvider>
		</StrictMode>,
	)
}
