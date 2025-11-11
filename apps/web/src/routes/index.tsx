import { createFileRoute } from '@tanstack/react-router'
import { DuePage } from '~/features/due'

export const Route = createFileRoute('/')({
	component: DuePage
})
