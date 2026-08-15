import { DragDropProvider } from '@dnd-kit/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { topicQueries } from '../../api/topicQueries'
import { treeifyTopics } from '../../utils/treeifyTopics'
import { LibrarySidebarContent } from './LibrarySidebarContent'

export function LibrarySidebar() {
	const { data: topics } = useSuspenseQuery(topicQueries.list())
	const topicTree = useMemo(() => treeifyTopics(topics), [topics])

	return (
		<DragDropProvider
			onDragEnd={event => {
				if (event.canceled) return

				const { source, target } = event.operation
				console.log(`source: ${source?.id}`)
				console.log(`target: ${target?.id}`)
			}}
		>
			<LibrarySidebarContent topics={topicTree} />
		</DragDropProvider>
	)
}
