import { createFileRoute } from '@tanstack/react-router'

import { DesignSystemPage } from '~/app/pages/DesignSystemPage'

export const Route = createFileRoute('/design-system')({
	component: DesignSystemPage,
})
