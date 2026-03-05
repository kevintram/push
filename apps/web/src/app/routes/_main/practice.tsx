import { createFileRoute } from '@tanstack/react-router'
import { PracticePage } from '~/app/pages/PracticePage'

export const Route = createFileRoute('/_main/practice')({
	component: PracticePage
})
