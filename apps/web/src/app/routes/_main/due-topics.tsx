import { createFileRoute } from '@tanstack/react-router'
import { DueTopicsPage } from '~/app/pages/DueTopicsPage'

export const Route = createFileRoute('/_main/due-topics')({
	component: DueTopicsPage
})
