import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext } from '@tanstack/react-router'

import { NotFoundPage } from '~/app/pages/NotFoundPage'
import { Root } from '~/app/Root'

export type RouterContext = {
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
	notFoundComponent: NotFoundPage,
	component: Root,
})
