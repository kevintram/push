import { ChevronDown, ListChecks, Loader2, Plus, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { TopicPanelHeader } from '~/components/ui/TopicPanelHeader'
import type { SourcePrerequisiteRead } from '~/models/entity-relations.types'
import { EntityType } from '~/models/entity-relations.types'
import { useAddSourcePrerequisite } from '../api/addSourcePrerequisite'
import { useSourcePrerequisites } from '../api/getSourcePrerequisites'
import { useRemoveSourcePrerequisite } from '../api/removeSourcePrerequisite'
import { AddPrerequisiteDialog } from './AddPrerequisiteDialog'

interface SourcePrerequisitesPanelProps {
	sourceId: number | undefined
	onTopicNavigate?: (topicId: number) => void
	onSourceNavigate?: (sourceId: number) => void
}

export function SourcePrerequisitesPanel({
	sourceId,
	onTopicNavigate,
	onSourceNavigate
}: SourcePrerequisitesPanelProps) {
	const [isCollapsed, setIsCollapsed] = useState(false)
	const [showAddDialog, setShowAddDialog] = useState(false)

	const { data: prerequisites = [], isLoading } =
		useSourcePrerequisites(sourceId)
	const addPrerequisite = useAddSourcePrerequisite()
	const removePrerequisite = useRemoveSourcePrerequisite()

	const isAdding = addPrerequisite.isPending
	const isRemoving = removePrerequisite.isPending

	const handleAddPrerequisite = useCallback(
		(entityType: EntityType, entityId: number) => {
			if (!sourceId) return
			addPrerequisite.mutate({
				sourceId,
				data: {
					prereq_entity_type: entityType,
					prereq_entity_id: entityId
				}
			})
		},
		[sourceId, addPrerequisite]
	)

	const handleRemove = useCallback(
		(prereq: SourcePrerequisiteRead) => {
			if (!sourceId) return

			if (prereq.prereq_topic_id) {
				removePrerequisite.mutate({
					sourceId,
					entityType: EntityType.Topic,
					entityId: prereq.prereq_topic_id
				})
			} else if (prereq.prereq_source_id) {
				removePrerequisite.mutate({
					sourceId,
					entityType: EntityType.Source,
					entityId: prereq.prereq_source_id
				})
			}
		},
		[sourceId, removePrerequisite]
	)

	const handleClick = useCallback(
		(prereq: SourcePrerequisiteRead) => {
			if (prereq.prereq_topic_id && onTopicNavigate) {
				onTopicNavigate(prereq.prereq_topic_id)
			} else if (prereq.prereq_source_id && onSourceNavigate) {
				onSourceNavigate(prereq.prereq_source_id)
			}
		},
		[onTopicNavigate, onSourceNavigate]
	)

	const getPrereqLabel = (prereq: SourcePrerequisiteRead): string => {
		if (prereq.prereq_topic) {
			return prereq.prereq_topic.name
		}
		if (prereq.prereq_source) {
			return prereq.prereq_source.title
		}
		return 'Unknown'
	}

	const getPrereqType = (prereq: SourcePrerequisiteRead): string => {
		if (prereq.prereq_topic_id) return 'Topic'
		if (prereq.prereq_source_id) return 'Source'
		return ''
	}

	return (
		<div className='flex flex-col'>
			<TopicPanelHeader
				actions={
					<Button
						className='gap-1'
						disabled={isAdding}
						onClick={() => setShowAddDialog(true)}
						size='sm'
						variant='secondary'
					>
						{isAdding ? (
							<Loader2 className='h-4 w-4 animate-spin' />
						) : (
							<Plus className='h-4 w-4' />
						)}
						Add
					</Button>
				}
				label={
					<Button
						className='flex items-center gap-2 p-0'
						onClick={() => setIsCollapsed(!isCollapsed)}
						variant='ghost'
					>
						<ListChecks className='h-4 w-4' />
						<span className='font-medium text-md text-muted-foreground'>
							Prerequisites ({prerequisites.length})
						</span>
						<ChevronDown
							className={`h-4 w-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
						/>
					</Button>
				}
			/>
			{!isCollapsed && (
				<div className='flex flex-col gap-2 py-4'>
					{isLoading && (
						<div className='flex items-center justify-center py-4'>
							<Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
						</div>
					)}
					{!isLoading && prerequisites.length === 0 && (
						<p className='py-2 text-muted-foreground text-sm'>
							No prerequisites defined
						</p>
					)}
					{prerequisites.map(prereq => (
						<div
							className='flex items-center justify-between rounded-md border border-border bg-card p-3'
							key={prereq.id}
						>
							<button
								className='flex-1 text-left'
								onClick={() => handleClick(prereq)}
								type='button'
							>
								<span className='font-medium text-sm'>
									{getPrereqLabel(prereq)}
								</span>
								<span className='ml-2 text-muted-foreground text-xs'>
									({getPrereqType(prereq)})
								</span>
							</button>
							<Button
								className='h-6 w-6 p-0'
								disabled={isRemoving}
								onClick={() => handleRemove(prereq)}
								size='sm'
								variant='ghost'
							>
								<X className='h-4 w-4' />
							</Button>
						</div>
					))}
				</div>
			)}

			<AddPrerequisiteDialog
				isAdding={isAdding}
				onOpenChange={setShowAddDialog}
				onSelected={handleAddPrerequisite}
				open={showAddDialog}
				sourceId={sourceId}
			/>
		</div>
	)
}
