import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '~/app/pages/HomePage'

export const Route = createFileRoute('/_main/home')({
	component: HomePage
})
