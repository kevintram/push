import { createFileRoute } from '@tanstack/react-router'
import { TodayPage } from '~/app/pages/TodayPage'

export const Route = createFileRoute('/_main/today')({
	component: TodayPage
})
