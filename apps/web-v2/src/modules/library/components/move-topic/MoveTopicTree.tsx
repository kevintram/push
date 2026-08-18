import type { Id } from '@convex/_generated/dataModel'
import { useMemo } from 'react'

import {
	Tree,
	TreeItem,
	TreeItemCollapsibleTrigger,
	TreeItemContent,
	TreeItemLabel,
} from '~/components/ui'
import type { TopicWithChildren } from '~/modules/library/types/topic.types'

import { MoveTopicItem } from './MoveTopicItem'

type MoveTopicTreeProps = {
	allowLibraryRoot?: boolean
	excludeTopicId?: Id<'topics'>
	onSelect: (destination: Id<'topics'> | null) => void
	selectedDestination: Id<'topics'> | null
	topics: Array<TopicWithChildren>
}

export function MoveTopicTree({
	allowLibraryRoot = false,
	excludeTopicId,
	onSelect,
	selectedDestination,
	topics,
}: MoveTopicTreeProps) {
	const filteredTopics = useMemo(
		() =>
			excludeTopicId ? excludeSubtree(topics, excludeTopicId) : topics,
		[topics, excludeTopicId],
	)

	const isLibrarySelected = selectedDestination === null

	return (
		<Tree>
			{allowLibraryRoot ? (
				<TreeItem
					expandable={false}
					label='Library'
					selected={isLibrarySelected}
				>
					<TreeItemContent>
						<TreeItemCollapsibleTrigger />
						<TreeItemLabel
							aria-pressed={isLibrarySelected}
							onClick={() => onSelect(null)}
						>
							Library
						</TreeItemLabel>
					</TreeItemContent>
				</TreeItem>
			) : null}
			{filteredTopics.map(topic => (
				<MoveTopicItem
					key={topic._id}
					{...topic}
					onSelect={onSelect}
					selectedTopicId={selectedDestination}
				/>
			))}
		</Tree>
	)
}

function excludeSubtree(
	topics: Array<TopicWithChildren>,
	excludeId: Id<'topics'>,
): Array<TopicWithChildren> {
	return topics
		.filter(topic => topic._id !== excludeId)
		.map(topic => ({
			...topic,
			childTopics: excludeSubtree(topic.childTopics, excludeId),
		}))
}
