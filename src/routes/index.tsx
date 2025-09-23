import { createFileRoute } from '@tanstack/react-router'
import { TodosPage } from '~/features/todos'

export const Route = createFileRoute('/')({
	component: TodosPage
})
