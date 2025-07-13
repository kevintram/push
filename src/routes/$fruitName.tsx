import { createFileRoute } from '@tanstack/react-router'
import { Details } from 'pages/Details'

export const Route = createFileRoute('/$fruitName')({
	component: Details
})
