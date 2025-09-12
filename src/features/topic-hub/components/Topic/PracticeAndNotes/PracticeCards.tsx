import {
	useDeleteMutation,
	useInsertMutation,
	useQuery,
	useUpdateMutation
} from '@supabase-cache-helpers/postgrest-react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Plus, Trash2 } from 'lucide-react'
import { use, useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Card, CardContent, CardFooter } from '~/components/ui/Card'
import { Dialog, DialogContent, DialogFooter } from '~/components/ui/Dialog'
import { Textarea } from '~/components/ui/Textarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'
import { TopicHubContext } from '../../../stores/SelectedTopicContext'

type PracticeCard = Tables<'practice_cards'>

export function PracticeCards() {
	const [numLanes, setNumLanes] = useState(3)
	const parentRef = useRef<HTMLDivElement>(null)

	const { selectedTopic } = use(TopicHubContext)

	const { data: practiceCards } = useQuery(
		supabase
			.from('practice_cards')
			.select('*')
			.eq('topic_id', selectedTopic?.id ?? 0)
			.order('id', { ascending: false })
	)

	const { mutateAsync: insertPracticeCard } = useInsertMutation(
		supabase.from('practice_cards'),
		['id'],
		'*'
	)

	const handleAddCard = useCallback(async () => {
		if (selectedTopic?.id) {
			await insertPracticeCard([
				{
					topic_id: selectedTopic.id,
					content: ''
				}
			])
		}
	}, [insertPracticeCard, selectedTopic?.id])

	// Masonry virtualization setup
	const virtualizer = useVirtualizer({
		count: (practiceCards?.length || 0) + 1,
		getScrollElement: () => parentRef.current,
		estimateSize: i => {
			// Add button is always at index 0
			if (i === 0) return 45

			const item = practiceCards?.[i - 1]
			if (!item?.content) return 100
			const baseHeight = 80
			const additionalHeight = Math.floor(item.content.length / 30) * 10
			return baseHeight + additionalHeight
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
				const minLaneWidth = 200
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
			<div className='flex-1 overflow-auto' ref={parentRef}>
				<div
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
										onClick={handleAddCard}
									>
										<CardContent className='flex items-center justify-center px-2 py-0.5'>
											<Plus className='h-4 w-4 text-muted-foreground' />
										</CardContent>
									</Card>
								</div>
							)
						}

						const card = practiceCards?.[virtualItem.index - 1]!
						return (
							<div
								className='absolute top-0'
								data-index={virtualItem.index}
								key={card.id}
								ref={virtualizer.measureElement}
								style={{
									left: `${virtualItem.lane * (100 / numLanes)}%`,
									width: `calc(${100 / numLanes}% - ${virtualItem.lane === numLanes - 1 ? 0 : 8}px)`,
									transform: `translateY(${virtualItem.start}px)`
								}}
							>
								<PracticeCardItem card={card} />
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}

function PracticeCardItem({ card }: { card: PracticeCard }) {
	const [isDialogOpen, setIsDialogOpen] = useState(false)

	const { mutateAsync: updatePracticeCard } = useUpdateMutation(
		supabase.from('practice_cards'),
		['id'],
		'*'
	)

	const { mutateAsync: deletePracticeCard } = useDeleteMutation(
		supabase.from('practice_cards'),
		['id']
	)

	const updateCardContent = useCallback(
		(newContent: string) => {
			if (card?.id) {
				updatePracticeCard({ id: card.id, content: newContent })
			}
		},
		[updatePracticeCard, card?.id]
	)

	const handleDelete = useCallback(async () => {
		if (card?.id) {
			await deletePracticeCard({ id: card.id })
			setIsDialogOpen(false)
		}
	}, [deletePracticeCard, card?.id])

	const { value: cardContent, onChange: onContentChange } = useAutoSave({
		initialValue: card?.content ?? '',
		onSave: updateCardContent,
		key: `practice-cards-${card?.id}`
	})

	return (
		<>
			<Card
				className='group relative cursor-pointer pb-0 transition-colors hover:bg-muted/50'
				onClick={() => setIsDialogOpen(true)}
			>
				<CardContent className=''>
					<div className='text-sm'>{card?.content}</div>
				</CardContent>
				<CardFooter className='pb-2 pl-2 opacity-0 transition-opacity group-hover:opacity-100'>
					<Button
						onClick={e => {
							e.stopPropagation()
							handleDelete()
						}}
						size='icon'
						variant='ghost'
					>
						<Trash2 className='h-4 w-4' />
					</Button>
				</CardFooter>
			</Card>

			<Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
				<DialogContent>
					<div className='py-4'>
						<Textarea
							autoFocus={true}
							className='!bg-transparent min-h-32 resize-none border-none shadow-none focus-visible:border-none focus-visible:ring-0'
							onChange={onContentChange}
							value={cardContent}
						/>
					</div>
					<DialogFooter className='sm:justify-start'>
						<Button onClick={handleDelete} size='icon' variant='ghost'>
							<Trash2 className='h-4 w-4' />
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
