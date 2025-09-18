import { useInsertMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Baby, Plus } from 'lucide-react'
import { use, useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '~/components/ui/Card'
import { useCreateRelationship } from '~/features/topic-hub/hooks/useCreateRelationship'
import { TopicHubContext } from '~/features/topic-hub/stores/SelectedTopicContext'
import { supabase } from '~/utils/supabase'
import { ChildCard } from './ChildCard'

export function TopicChildrenPanel() {
	const [numLanes, setNumLanes] = useState(3)
	const parentRef = useRef<HTMLDivElement>(null)
	const { selectedTopic } = use(TopicHubContext)

	const children = selectedTopic?.children || []

	const { mutateAsync: insertTopicMutation } = useInsertMutation(
		supabase.from('topics'),
		['id'],
		'*'
	)

	const createRelationship = useCreateRelationship()

	const handleAddChild = useCallback(async () => {
		if (!selectedTopic) return

		try {
			// Create a blank topic
			const createdTopic = await insertTopicMutation([{ name: '', notes: '' }])

			if (!createdTopic?.[0]) {
				throw new Error('Failed to create topic')
			}

			// Create parent-child relationship
			await createRelationship.mutateAsync({
				parent: selectedTopic.id,
				child: createdTopic[0].id
			})
		} catch (_error) {}
	}, [selectedTopic, insertTopicMutation, createRelationship])

	// Masonry virtualization setup
	const virtualizer = useVirtualizer({
		count: children.length + 1, // +1 for add button
		getScrollElement: () => parentRef.current,
		estimateSize: i => {
			// Add button is always at index 0
			if (i === 0) return 60

			// Estimate height based on topic name and notes length
			const child = children[i - 1]
			if (!child) return 100
			const baseHeight = 80
			const nameHeight = Math.floor((child.name?.length || 0) / 25) * 10
			const notesHeight = Math.floor((child.notes?.length || 0) / 40) * 10
			return baseHeight + nameHeight + notesHeight
		},
		overscan: 5,
		lanes: numLanes,
		gap: 8
	})

	// Calculate lanes based on container width
	useEffect(() => {
		const resizeObserver = new ResizeObserver(entries => {
			const containerWidth = entries[0]?.contentRect.width
			if (containerWidth) {
				const minLaneWidth = 180
				const gap = 16
				const calculatedLanes = Math.max(
					1,
					Math.floor((containerWidth + gap) / (minLaneWidth + gap))
				)
				setNumLanes(calculatedLanes)
			}
		})

		if (parentRef.current) {
			resizeObserver.observe(parentRef.current)
		}

		return () => resizeObserver.disconnect()
	}, [])

	return (
		<div className='flex h-full flex-col'>
			<div className='mb-3 flex items-center gap-2'>
				<Baby className='h-4 w-4' />
				<span className='font-medium text-muted-foreground text-xs'>
					Children
				</span>
			</div>
			<div className='flex-1 overflow-auto'>
				<div
					ref={parentRef}
					style={{
						height: `${virtualizer.getTotalSize()}px`,
						width: '100%',
						position: 'relative'
					}}
				>
					{virtualizer.getVirtualItems().map(virtualItem => {
						// Add button is at index 0
						if (virtualItem.index === 0) {
							return (
								<div
									className='absolute top-0'
									data-index={virtualItem.index}
									key='add-button'
									ref={virtualizer.measureElement}
									style={{
										left: `${virtualItem.lane * (100 / numLanes)}%`,
										width: `calc(${100 / numLanes}% - ${virtualItem.lane === numLanes - 1 ? 0 : 8}px)`,
										transform: `translateY(${virtualItem.start}px)`
									}}
								>
									<Card
										className='cursor-pointer border-2 border-dashed transition-colors hover:bg-muted/50'
										onClick={handleAddChild}
									>
										<CardContent className='flex items-center justify-center p-3'>
											<Plus className='h-4 w-4 text-muted-foreground' />
										</CardContent>
									</Card>
								</div>
							)
						}

						const child = children[virtualItem.index - 1]!
						return (
							<div
								className='absolute top-0'
								data-index={virtualItem.index}
								key={child.id}
								ref={virtualizer.measureElement}
								style={{
									left: `${virtualItem.lane * (100 / numLanes)}%`,
									width: `calc(${100 / numLanes}% - ${virtualItem.lane === numLanes - 1 ? 0 : 8}px)`,
									transform: `translateY(${virtualItem.start}px)`
								}}
							>
								<ChildCard child={child} />
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}
