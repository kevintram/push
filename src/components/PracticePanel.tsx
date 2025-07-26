import { useVirtualizer } from '@tanstack/react-virtual'
import { Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Practice } from '~/types/notes'
import { Button } from './ui/Button'
import { Card, CardContent } from './ui/Card'
import { Input } from './ui/Input'

function PracticePanel(props: { practice: Array<Practice> | undefined }) {
	const [questionsSearchValue, setQuestionsSearchValue] = useState('')
	const [numLanes, setNumLanes] = useState(4)
	const parentRef = useRef<HTMLDivElement>(null)

	// Filter practice elements based on search
	const filteredElements = useMemo(() => {
		if (!questionsSearchValue) {
			return props.practice
		}

		return props.practice?.filter(element =>
			element.title?.toLowerCase().includes(questionsSearchValue.toLowerCase())
		)
	}, [props.practice, questionsSearchValue])

	// Calculate number of lanes based on container width
	useEffect(() => {
		let timeoutId: NodeJS.Timeout

		const resizeObserver = new ResizeObserver(entries => {
			clearTimeout(timeoutId)
			timeoutId = setTimeout(() => {
				const containerWidth = entries[0]?.contentRect.width
				if (containerWidth) {
					const minLaneWidth = 120 // minimum width per lane in pixels
					const gap = 16
					const calculatedLanes = Math.max(
						1,
						Math.floor((containerWidth + gap) / (minLaneWidth + gap))
					)
					setNumLanes(calculatedLanes)
				}
			}, 150) // 150ms debounce delay
		})

		if (parentRef.current) {
			resizeObserver.observe(parentRef.current)
		}

		return () => {
			clearTimeout(timeoutId)
			resizeObserver.disconnect()
		}
	}, [])

	// Masonry virtualization setup
	const gap = 8 //px

	const virtualizer = useVirtualizer({
		count: filteredElements?.length ?? 0,
		getScrollElement: () => parentRef.current,
		estimateSize: i => {
			const el = filteredElements?.[i]
			if (!el?.title) {
				return 100
			}
			const baseHeight = 80
			const additionalHeight = Math.floor(el.title.length / 30) * 10
			return baseHeight + additionalHeight
		},
		overscan: 5,
		lanes: numLanes,
		gap // this only sets vertical gap
	})

	return (
		<Card className='flex-1'>
			<CardContent className='flex h-full flex-col gap-4'>
				<div className='flex w-full items-center gap-2'>
					<div className='relative flex-1'>
						<Search className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
						<Input
							className='pl-9'
							onChange={e => setQuestionsSearchValue(e.target.value)}
							placeholder='Search'
							value={questionsSearchValue}
						/>
					</div>
					<Button size='icon' variant='secondary'>
						<Plus className='h-4 w-4' />
					</Button>
				</div>

				<div
					className='h-full w-full'
					ref={parentRef}
					style={{
						overflow: 'auto'
					}}
				>
					<div
						style={{
							height: `${virtualizer.getTotalSize()}px`,
							width: '100%',
							position: 'relative'
						}}
					>
						{virtualizer.getVirtualItems().map(virtualItem => (
							<div
								className='rounded-md border-1 bg-muted/50 p-4'
								data-index={virtualItem.index}
								key={virtualItem.index}
								ref={virtualizer.measureElement}
								style={{
									position: 'absolute',
									top: 0,
									left: `${virtualItem.lane * (100 / numLanes)}%`,
									width: `calc(${100 / numLanes}% - ${virtualItem.lane === numLanes - 1 ? 0 : gap}px)`, // horizontal gap set here
									transform: `translateY(${virtualItem.start}px)`
								}}
							>
								{filteredElements?.[virtualItem.index]?.title}
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

export { PracticePanel }
