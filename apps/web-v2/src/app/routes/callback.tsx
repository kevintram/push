import { createFileRoute } from '@tanstack/react-router'

import { AuthCallbackPage } from '../pages/AuthCallbackPage'

export const Route = createFileRoute('/callback')({
	component: AuthCallbackPage,
})
