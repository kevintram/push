import { createFileRoute, notFound } from '@tanstack/react-router'

import { DesignSystemPage } from '~/app/pages/DesignSystemPage'

export const Route = createFileRoute('/design-system')({
	beforeLoad: () => {
		if (!import.meta.env.DEV) {
			// only allow in dev
			throw notFound()
		}
	},
	component: DesignSystemPage,
})
