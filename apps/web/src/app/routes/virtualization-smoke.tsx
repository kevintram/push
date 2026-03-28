import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'

const INITIAL_ITEM_COUNT = 400
const APPEND_BATCH_SIZE = 120

type SmokeItem = {
	id: number
	title: string
	body: string
}

export const Route = createFileRoute('/virtualization-smoke')({
	component: VirtualizationSmokePage
})

function VirtualizationSmokePage() {
	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const getScrollElement = useCallback(() => scrollContainerRef.current, [])
	const [itemCount, setItemCount] = useState(INITIAL_ITEM_COUNT)

	const items = useMemo<Array<SmokeItem>>(
		() =>
			Array.from({ length: itemCount }, (_, index) => ({
				id: index,
				title: `Virtual item ${index}`,
				body: `This is a deterministic smoke-test card for index ${index}.`
			})),
		[itemCount]
	)

	const estimateItemSize = useCallback(
		(item: SmokeItem) => 112 + (item.id % 5) * 16,
		[]
	)

	const getItemKey = useCallback((item: SmokeItem) => item.id, [])

	const renderItem = useCallback(
		(item: SmokeItem) => (
			<article className='rounded-md border bg-card p-3'>
				<h2 className='font-semibold text-sm'>{item.title}</h2>
				<p className='mt-2 text-muted-foreground text-sm'>{item.body}</p>
			</article>
		),
		[]
	)

	return (
		<main className='h-screen p-6'>
			<h1 className='mb-4 font-bold text-lg'>Virtualization smoke</h1>
			<div className='mb-4 flex items-center gap-3'>
				<button
					className='rounded-md border px-3 py-2 text-sm'
					data-testid='virtualization-append-items'
					onClick={() => setItemCount(count => count + APPEND_BATCH_SIZE)}
					type='button'
				>
					Append {APPEND_BATCH_SIZE} items
				</button>
				<span className='text-muted-foreground text-sm'>
					Total items: {itemCount}
				</span>
			</div>
			<div
				className='h-[75vh] overflow-y-auto rounded-md border'
				data-testid='virtualization-scroll-container'
				ref={scrollContainerRef}
			>
				<div className='p-4'>
					<MasonryLayout
						estimateItemSize={estimateItemSize}
						gap={12}
						getItemKey={getItemKey}
						getScrollElement={getScrollElement}
						items={items}
						minItemWidth={240}
						renderItem={renderItem}
					/>
				</div>
			</div>
		</main>
	)
}
