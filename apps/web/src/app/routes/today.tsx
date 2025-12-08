import { createFileRoute } from '@tanstack/react-router'
import { TodayPage } from '~/app/pages/TodayPage'

export const Route = createFileRoute('/today')({
	component: TodayPage
})
