import { useVirtualizer } from '@tanstack/react-virtual'
import {
	Bold,
	BookOpen,
	Columns,
	Heading,
	Italic,
	List,
	Plus,
	Search,
	Target,
	Underline
} from 'lucide-react'
import { use, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Card, CardContent, CardHeader } from '~/components/ui/Card'
import { Input } from '~/components/ui/Input'
import { Separator } from '~/components/ui/Separator'
import { SelectedTopicContext } from '../stores/SelectedTopicContext'

export function PracticeNotesPanel() {
	const { selectedTopic } = use(SelectedTopicContext)

	const [activeTab, setActiveTab] = useState<'notes' | 'practice'>('practice') // Practice is now default
	const [isSplitView, setIsSplitView] = useState(false)
	const [searchValue, setSearchValue] = useState('')
	const [numLanes, setNumLanes] = useState(3)
	const parentRef = useRef<HTMLDivElement>(null)

	// Filter practice items based on search
	const filteredPractice = useMemo(() => {
		if (!searchValue) return selectedTopic?.practicePrompts || []
		return (selectedTopic?.practicePrompts || []).filter(item =>
			item.title.toLowerCase().includes(searchValue.toLowerCase())
		)
	}, [searchValue, selectedTopic?.practicePrompts])

	// Masonry virtualization setup
	const virtualizer = useVirtualizer({
		count: filteredPractice.length,
		getScrollElement: () => parentRef.current,
		estimateSize: i => {
			const item = filteredPractice[i]
			if (!item?.title) return 100
			const baseHeight = 80
			const additionalHeight = Math.floor(item.title.length / 30) * 10
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

	const renderPracticeView = () => (
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
								{filteredPractice[virtualItem.index]?.title}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)

	const renderNotesView = () => (
		<div className='flex h-full flex-col gap-4'>
			<div className='flex-1 space-y-4'>
				<div className='flex-1 rounded-lg border bg-muted/10 p-4'>
					<div className='text-sm'>
						{selectedTopic?.notes || (
							<span className='text-muted-foreground italic'>
								Start taking notes about {selectedTopic?.title}...
							</span>
						)}
					</div>
				</div>
			</div>
			<div className='flex items-center justify-center'>
				<div className='flex items-center gap-1 rounded-md border bg-background px-2 py-1'>
					<Button size='sm' variant='ghost'>
						<Bold className='h-4 w-4' />
					</Button>
					<Button size='sm' variant='ghost'>
						<Italic className='h-4 w-4' />
					</Button>
					<Button size='sm' variant='ghost'>
						<Underline className='h-4 w-4' />
					</Button>
					<Separator className='h-4' orientation='vertical' />
					<Button size='sm' variant='ghost'>
						<Heading className='h-4 w-4' />
					</Button>
					<Button size='sm' variant='ghost'>
						<List className='h-4 w-4' />
					</Button>
				</div>
			</div>
		</div>
	)

	if (isSplitView) {
		return (
			<Card className='w-full flex-1'>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<div className='rounded bg-primary/10 p-1.5'>
								<BookOpen className='h-4 w-4 text-primary' />
							</div>
							<span className='font-medium'>Practice & Notes</span>
						</div>
						<Button
							className='bg-primary/10'
							onClick={() => setIsSplitView(false)}
							size='icon'
							variant='ghost'
						>
							<Columns className='h-4 w-4' />
						</Button>
					</div>
				</CardHeader>
				<CardContent className='flex min-h-0 flex-1 gap-4'>
					<div className='min-w-0 flex-1'>{renderPracticeView()}</div>
					<Separator orientation='vertical' />
					<div className='min-w-0 flex-1'>{renderNotesView()}</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className='w-full flex-1'>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<div className='flex gap-2'>
						<Button
							onClick={() => setActiveTab('practice')}
							size='sm'
							variant={activeTab === 'practice' ? 'default' : 'ghost'}
						>
							<Target className='mr-2 h-4 w-4' />
							Practice
						</Button>
						<Button
							onClick={() => setActiveTab('notes')}
							size='sm'
							variant={activeTab === 'notes' ? 'default' : 'ghost'}
						>
							<BookOpen className='mr-2 h-4 w-4' />
							Notes
						</Button>
					</div>
					<Button
						onClick={() => setIsSplitView(true)}
						size='icon'
						variant='ghost'
					>
						<Columns className='h-4 w-4' />
					</Button>
				</div>
			</CardHeader>
			<CardContent className='min-h-0 flex-1'>
				{activeTab === 'notes' && renderNotesView()}
				{activeTab === 'practice' && renderPracticeView()}
			</CardContent>
		</Card>
	)
}
