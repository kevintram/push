import { createFileRoute } from '@tanstack/react-router'
import { ReadPage } from '~/app/pages/ReadPage'

export const Route = createFileRoute('/_main/read')({
	component: ReadPage
})
