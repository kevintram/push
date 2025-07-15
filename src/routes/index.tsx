import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	component: Library
})

function Library() {
	return <div>Hello "/Library"!</div>
}
