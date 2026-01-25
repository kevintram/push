import type { ReactNode } from 'react'
import { PracticeCard } from '~/features/practices/components/PracticeCard'
import type { Practice } from '~/features/practices/types/practice.types'
import { SourceCard } from '~/features/sources/components/SourceCard'
import type { Source } from '~/features/sources/types/source.types'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Topic } from '~/features/topics/types/topic.types'

export type EntityType = 'topic' | 'source' | 'practice'

export type EntityItem =
	| { type: 'topic'; item: Topic }
	| { type: 'source'; item: Source }
	| { type: 'practice'; item: Practice }

interface EntityCardProps {
	entity: EntityItem
	onEntityClick?: (entity: EntityItem) => void
	minHeight?: number
	searchQuery?: string
	headerRight?: ReactNode
	showLeavingSoon?: boolean
}

export function EntityCard({
	entity,
	onEntityClick,
	minHeight,
	searchQuery,
	headerRight,
	showLeavingSoon
}: EntityCardProps) {
	switch (entity.type) {
		case 'topic':
			return (
				<TopicCard
					headerRight={headerRight}
					minHeight={minHeight}
					onTopicClick={
						onEntityClick
							? () => onEntityClick({ type: 'topic', item: entity.item })
							: undefined
					}
					searchQuery={searchQuery}
					showLeavingSoon={showLeavingSoon}
					topic={entity.item}
				/>
			)
		case 'source':
			return (
				<SourceCard
					headerRight={headerRight}
					minHeight={minHeight}
					onSourceClick={
						onEntityClick
							? () => onEntityClick({ type: 'source', item: entity.item })
							: undefined
					}
					searchQuery={searchQuery}
					showLeavingSoon={showLeavingSoon}
					source={entity.item}
				/>
			)
		case 'practice':
			return (
				<PracticeCard
					headerRight={headerRight}
					minHeight={minHeight}
					onPracticeClick={
						onEntityClick
							? () => onEntityClick({ type: 'practice', item: entity.item })
							: undefined
					}
					practice={entity.item}
					searchQuery={searchQuery}
					showLeavingSoon={showLeavingSoon}
				/>
			)
		default: {
			const _exhaustiveCheck: never = entity
			return _exhaustiveCheck
		}
	}
}

/**
 * Get the unique key for an entity item
 */
export function getEntityKey(entity: EntityItem): string {
	return `${entity.type}-${entity.item.id}`
}

/**
 * Get the display title for an entity
 */
export function getEntityTitle(entity: EntityItem): string {
	switch (entity.type) {
		case 'topic':
			return entity.item.name || 'Untitled Topic'
		case 'source':
			return entity.item.title || 'Untitled Source'
		case 'practice':
			return entity.item.prompt || 'Untitled Practice'
		default: {
			const _exhaustiveCheck: never = entity
			return _exhaustiveCheck
		}
	}
}

/**
 * Get the notes/description for an entity
 */
export function getEntityNotes(entity: EntityItem): string {
	switch (entity.type) {
		case 'topic':
		case 'source':
			return entity.item.notes || ''
		case 'practice':
			return entity.item.answer || ''
		default: {
			const _exhaustiveCheck: never = entity
			return _exhaustiveCheck
		}
	}
}

/**
 * Estimate the height for an entity card in masonry layout
 */
export function estimateEntitySize(entity: EntityItem): number {
	const baseHeight = 80
	const lineHeight = 10
	const numCharsPerLine = 30
	const newLine = 10
	const minHeight = 96

	const title = getEntityTitle(entity)
	const notes = getEntityNotes(entity)

	const titleHeight = Math.floor(title.length / numCharsPerLine) * lineHeight
	const notesHeight = Math.floor(notes.length / numCharsPerLine) * lineHeight

	const calculatedHeight = baseHeight + titleHeight + newLine + notesHeight

	return Math.max(calculatedHeight, minHeight)
}
