import type { Id } from '@convex/_generated/dataModel'
import { DragDropProvider } from '@dnd-kit/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { topicQueries, useUpdateTopic } from '../../api/topicQueries'
import { treeifyTopics } from '../../utils/treeifyTopics'
import { LibrarySidebarContent } from './LibrarySidebarContent'

export function LibrarySidebar() {
	const { data: topics } = useSuspenseQuery(topicQueries.list())
	const topicTree = useMemo(() => treeifyTopics(topics), [topics])
	const updateTopic = useUpdateTopic()

	return (
		<DragDropProvider
			onDragEnd={event => {
				if (event.canceled) return

				const { source, target } = event.operation

				if (
					source?.id === undefined ||
					target?.id === undefined ||
					source?.id === target?.id
				) {
					return
				}

				if (target.id === 'library-root') {
					updateTopic.mutate({
						topicId: source.id as Id<'topics'>,
						parentId: null,
					})
				} else {
					updateTopic.mutate({
						topicId: source.id as Id<'topics'>,
						parentId: target.id as Id<'topics'>,
					})
				}
			}}
		>
			<LibrarySidebarContent topics={topicTree} />
		</DragDropProvider>
	)
}
