import { createFileRoute } from '@tanstack/react-router'
import { ReadyPage } from '~/app/pages/ReadyPage'

export const Route = createFileRoute('/_main/ready')({
	component: ReadyPage
})
