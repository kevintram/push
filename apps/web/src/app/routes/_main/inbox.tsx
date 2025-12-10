import { createFileRoute } from '@tanstack/react-router'
import { InboxPage } from '~/app/pages/InboxPage'

export const Route = createFileRoute('/_main/inbox')({
	component: InboxPage
})
