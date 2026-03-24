import { Button } from '~/components/ui/button'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger
} from '~/components/ui/sheet'
import { Sidebar, SidebarProvider } from '~/components/ui/sidebar'
import { cn } from '~/lib/utils'
import { Library } from 'lucide-react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { useEffect, useState } from 'react'
import {
	clampTopicNavigatorWidth,
	getStoredTopicNavigatorWidth,
	TOPIC_NAVIGATOR_WIDTH_STORAGE_KEY
} from './TopicNavigator.shared'
import { TopicNavigatorPanel } from './TopicNavigatorContent'

export function TopicNavigatorRail({
	activeTopicId,
	className
}: {
	activeTopicId?: number | null
	className?: string
}) {
	const [sidebarWidth, setSidebarWidth] = useState(getStoredTopicNavigatorWidth)
	const [isResizing, setIsResizing] = useState(false)

	useEffect(() => {
		if (typeof window === 'undefined') return
		if (typeof window.localStorage?.setItem !== 'function') return

		window.localStorage.setItem(
			TOPIC_NAVIGATOR_WIDTH_STORAGE_KEY,
			sidebarWidth.toString()
		)
	}, [sidebarWidth])

	useEffect(() => {
		if (typeof document === 'undefined') return
		if (!isResizing) return

		document.body.classList.add('cursor-col-resize', 'select-none')

		return () => {
			document.body.classList.remove('cursor-col-resize', 'select-none')
		}
	}, [isResizing])

	const handleResizeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
		event.preventDefault()

		const startX = event.clientX
		const startWidth = sidebarWidth

		setIsResizing(true)

		const handlePointerMove = (moveEvent: PointerEvent) => {
			const nextWidth = clampTopicNavigatorWidth(
				startWidth + (moveEvent.clientX - startX)
			)
			setSidebarWidth(nextWidth)
		}

		const handlePointerUp = () => {
			setIsResizing(false)
			window.removeEventListener('pointermove', handlePointerMove)
			window.removeEventListener('pointerup', handlePointerUp)
		}

		window.addEventListener('pointermove', handlePointerMove)
		window.addEventListener('pointerup', handlePointerUp)
	}

	return (
		<SidebarProvider
			className={cn(
				'relative hidden h-full min-h-0 w-auto flex-none md:flex',
				className
			)}
			style={{ '--sidebar-width': `${sidebarWidth}px` } as CSSProperties}
		>
			<Sidebar
				className='h-full border-sidebar-border/70 border-r bg-background'
				collapsible='none'
			>
				<TopicNavigatorPanel
					activeTopicId={activeTopicId}
					autoScrollActiveTopic={true}
					enableDragAndDrop={true}
				/>
			</Sidebar>
			<div
				aria-hidden='true'
				className='absolute top-0 right-0 z-20 hidden h-full w-3 translate-x-1/2 cursor-col-resize items-center justify-center md:flex'
				onPointerDown={handleResizeStart}
			>
				<div
					className={cn(
						'h-16 w-px rounded-full bg-border/70 transition-colors',
						isResizing && 'bg-foreground/60'
					)}
				/>
			</div>
		</SidebarProvider>
	)
}

export function TopicNavigatorSheet({
	activeTopicId,
	className
}: {
	activeTopicId?: number | null
	className?: string
}) {
	const [open, setOpen] = useState(false)

	return (
		<Sheet onOpenChange={setOpen} open={open}>
			<SheetTrigger
				render={
					<Button
						className={cn('md:hidden', className)}
						size='sm'
						variant='outline'
					/>
				}
			>
				<Library className='h-4 w-4' />
				Hierarchy
			</SheetTrigger>
			<SheetContent className='w-full sm:max-w-sm' side='right'>
				<SheetHeader>
					<SheetTitle>Topic hierarchy</SheetTitle>
					<SheetDescription>
						Browse the full topic and subtopic tree.
					</SheetDescription>
				</SheetHeader>
				<div className='flex min-h-0 flex-1 flex-col px-4 pb-4'>
					<TopicNavigatorPanel
						activeTopicId={activeTopicId}
						onNavigate={() => setOpen(false)}
					/>
				</div>
			</SheetContent>
		</Sheet>
	)
}
