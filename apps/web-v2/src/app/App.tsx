import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { Toaster, TooltipProvider } from '~/components/ui'
import { queryClient } from '~/lib/convex'
import { AuthProvider } from '~/modules/auth/components/AuthProvider'
import { HideModeProvider } from '~/modules/reviews'

import { AuthedRouterProvider } from './AuthedRouterProvider'
import { router } from './router'

const showDevtools = import.meta.env.DEV && !import.meta.env.VITEST

export function App() {
	return (
		<AuthProvider router={router}>
			<QueryClientProvider client={queryClient}>
				<TooltipProvider>
					<HideModeProvider>
						<AuthedRouterProvider />
					</HideModeProvider>
				</TooltipProvider>
				<Toaster />
				{showDevtools && <ReactQueryDevtools />}
			</QueryClientProvider>
		</AuthProvider>
	)
}
