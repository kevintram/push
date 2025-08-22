import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Plus, Search } from 'lucide-react'
import { use, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Input } from '~/components/ui/Input'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'
import { SelectedTopicContext } from '../stores/SelectedTopicContext'

export function PracticeCards() {
	const [searchValue, setSearchValue] = useState('')
	const [numLanes, setNumLanes] = useState(3)
	const parentRef = useRef<HTMLDivElement>(null)

	const { selectedTopic } = use(SelectedTopicContext)

	const { data: practicePrompts } = useQuery(
		supabase
			.from('practice_cards')
			.select('*')
			.eq('topic_id', selectedTopic?.id ?? 0),
		{
			enabled: selectedTopic !== undefined
		}
	)

	// Filter practice items based on search
	const filteredPractice = useMemo(() => {
		if (!searchValue) return practicePrompts || []
		return (practicePrompts || []).filter((item: Tables<'practice_cards'>) =>
			item.content.toLowerCase().includes(searchValue.toLowerCase())
		)
	}, [searchValue, practicePrompts])

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
				<Button size='icon' variant='secondary'>
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
					{virtualizer.getVirtualItems().map(virtualItem => (
						<div
							className='absolute top-0 cursor-pointer rounded-lg border bg-muted/30 p-4 transition-colors hover:bg-muted/50'
							data-index={virtualItem.index}
							key={virtualItem.index}
							ref={virtualizer.measureElement}
							style={{
								left: `${virtualItem.lane * (100 / numLanes)}%`,
								width: `calc(${100 / numLanes}% - ${virtualItem.lane === numLanes - 1 ? 0 : 8}px)`,
								transform: `translateY(${virtualItem.start}px)`
							}}
						>
							<div className='text-sm'>
								{filteredPractice[virtualItem.index]?.content}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
