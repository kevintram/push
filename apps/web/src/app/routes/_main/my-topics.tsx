import { createFileRoute } from '@tanstack/react-router'
import { MyTopicsPage } from '~/app/pages/MyTopicsPage'

export const Route = createFileRoute('/_main/my-topics')({
	component: MyTopicsPage
})
