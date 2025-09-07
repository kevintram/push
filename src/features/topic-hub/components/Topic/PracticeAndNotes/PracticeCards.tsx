import {
	useDeleteMutation,
	useInsertMutation,
	useQuery,
	useUpdateMutation
} from '@supabase-cache-helpers/postgrest-react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Plus, Search, Trash2 } from 'lucide-react'
import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Card, CardContent } from '~/components/ui/Card'
import { Dialog, DialogContent, DialogFooter } from '~/components/ui/Dialog'
import { Input } from '~/components/ui/Input'
import { Textarea } from '~/components/ui/Textarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'
import { TopicHubContext } from '../../../stores/SelectedTopicContext'

type PracticeCard = Tables<'practice_cards'>

export function PracticeCards() {
	const [searchValue, setSearchValue] = useState('')
	const [numLanes, setNumLanes] = useState(3)
	const parentRef = useRef<HTMLDivElement>(null)

	const { selectedTopic } = use(TopicHubContext)

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

	const { data: practiceCards } = useQuery(
		supabase
			.from('practice_cards')
			.select('*')
			.eq('topic_id', selectedTopic?.id ?? 0)
			.order('id', { ascending: false })
	)

	// Filter practice items based on search
	const filteredPractice = useMemo(() => {
		if (!searchValue) return practiceCards || []
		return (practiceCards || []).filter((item: PracticeCard) =>
			item.content.toLowerCase().includes(searchValue.toLowerCase())
		)
	}, [searchValue, practiceCards])

	// Masonry virtualization setup
	const virtualizer = useVirtualizer({
		count: filteredPractice.length,
		getScrollElement: () => parentRef.current,
		estimateSize: i => {
			const item = filteredPractice[i]
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
		<div className='flex h-full flex-col gap-4'>
			<div className='flex items-center gap-2'>
				<div className='relative flex-1'>
					<Search className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
					<Input
						className='pl-9'
						onChange={e => setSearchValue(e.target.value)}
						placeholder='Search practice items...'
						value={searchValue}
					/>
				</div>
				<Button onClick={handleAddCard} size='icon' variant='secondary'>
					<Plus className='h-4 w-4' />
				</Button>
			</div>

			<div className='flex-1 overflow-auto' ref={parentRef}>
				<div
					style={{
						height: `${virtualizer.getTotalSize()}px`,
						width: '100%',
						position: 'relative'
					}}
				>
					{virtualizer.getVirtualItems().map(virtualItem => {
						const card = filteredPractice[virtualItem.index]!
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
		onSave: updateCardContent
	})

	return (
		<>
			<Card
				className='cursor-pointer transition-colors hover:bg-muted/50'
				onClick={() => setIsDialogOpen(true)}
			>
				<CardContent className='p-4'>
					<div className='text-sm'>{card?.content}</div>
				</CardContent>
			</Card>

			<Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
				<DialogContent>
					<div className='py-4'>
						<Textarea
							autoFocus={true}
							className='min-h-32 resize-none border-none shadow-none focus-visible:border-none focus-visible:ring-0'
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
