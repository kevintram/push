import { Link } from '@tanstack/react-router'
import { ChevronRight, House, Library } from 'lucide-react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '~/components/ui/button'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { Separator } from '~/components/ui/separator'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger
} from '~/components/ui/sheet'
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarProvider
} from '~/components/ui/sidebar'
import { cn } from '~/lib/utils'
import { useTopicTree } from '../hooks/useTopicTree'
import { getTopicDisplayTitle, type TopicTreeNode } from '../utils/topicTree'

const TOPIC_NAVIGATOR_MIN_WIDTH_PX = 12 * 16
const TOPIC_NAVIGATOR_DEFAULT_WIDTH_PX = 18 * 16
const TOPIC_NAVIGATOR_MAX_WIDTH_PX = 30 * 16
const TOPIC_NAVIGATOR_WIDTH_STORAGE_KEY = 'topic-navigator-width'

function areNumberArraysEqual(left: Array<number>, right: Array<number>) {
	if (left.length !== right.length) return false

	for (let index = 0; index < left.length; index += 1) {
		if (left[index] !== right[index]) return false
	}

	return true
}

function clampTopicNavigatorWidth(width: number) {
	return Math.min(
		Math.max(width, TOPIC_NAVIGATOR_MIN_WIDTH_PX),
		TOPIC_NAVIGATOR_MAX_WIDTH_PX
	)
}

function getStoredTopicNavigatorWidth() {
	if (typeof window === 'undefined') return TOPIC_NAVIGATOR_DEFAULT_WIDTH_PX
	if (typeof window.localStorage?.getItem !== 'function') {
		return TOPIC_NAVIGATOR_DEFAULT_WIDTH_PX
	}

	const storedWidth = window.localStorage.getItem(
		TOPIC_NAVIGATOR_WIDTH_STORAGE_KEY
	)

	if (storedWidth == null) return TOPIC_NAVIGATOR_DEFAULT_WIDTH_PX

	const parsedWidth = Number.parseFloat(storedWidth)
	if (Number.isNaN(parsedWidth)) return TOPIC_NAVIGATOR_DEFAULT_WIDTH_PX

	return clampTopicNavigatorWidth(parsedWidth)
}

function TopicNavigatorContent({
	activeTopicId,
	onNavigate
}: {
	activeTopicId?: number | null
	onNavigate?: () => void
}) {
	const { roots, ancestorIdsById, isLoading, error } = useTopicTree()
	const defaultExpandedIds = useMemo(() => {
		if (activeTopicId == null) return []

		const activeBranchIds = ancestorIdsById.get(activeTopicId) ?? []
		return [...activeBranchIds, activeTopicId]
	}, [activeTopicId, ancestorIdsById])
	const [expandedIds, setExpandedIds] =
		useState<Array<number>>(defaultExpandedIds)

	useEffect(() => {
		setExpandedIds(previousExpandedIds =>
			areNumberArraysEqual(previousExpandedIds, defaultExpandedIds)
				? previousExpandedIds
				: defaultExpandedIds
		)
	}, [defaultExpandedIds])

	const expandedIdSet = useMemo(() => new Set(expandedIds), [expandedIds])

	const toggleExpanded = (topicId: number) => {
		setExpandedIds(previousExpandedIds =>
			previousExpandedIds.includes(topicId)
				? previousExpandedIds.filter(id => id !== topicId)
				: [...previousExpandedIds, topicId]
		)
	}

	if (isLoading) {
		return <LoadingSpinner containerClassName='min-h-32' />
	}

	if (error) {
		return (
			<p className='px-3 py-2 text-muted-foreground text-sm'>
				Failed to load topic hierarchy.
			</p>
		)
	}

	if (roots.length === 0) {
		return (
			<p className='px-3 py-2 text-muted-foreground text-sm'>No topics yet.</p>
		)
	}

	return (
		<nav aria-label='Topic hierarchy'>
			<ul className='space-y-1'>
				{roots.map(rootNode => (
					<TopicNavigatorItem
						activeTopicId={activeTopicId}
						depth={0}
						expandedIdSet={expandedIdSet}
						key={rootNode.id}
						node={rootNode}
						onNavigate={onNavigate}
						onToggleExpanded={toggleExpanded}
					/>
				))}
			</ul>
		</nav>
	)
}

function TopicNavigatorItem({
	node,
	depth,
	activeTopicId,
	expandedIdSet,
	onToggleExpanded,
	onNavigate
}: {
	node: TopicTreeNode
	depth: number
	activeTopicId?: number | null
	expandedIdSet: Set<number>
	onToggleExpanded: (topicId: number) => void
	onNavigate?: () => void
}) {
	const hasChildren = node.children.length > 0
	const isExpanded = expandedIdSet.has(node.id)
	const isActive = node.id === activeTopicId
	const label = getTopicDisplayTitle(node.title, node.body)

	return (
		<li>
			<div
				className='flex items-center gap-1'
				style={{ paddingLeft: `${depth * 0.75}rem` }}
			>
				{hasChildren ? (
					<Button
						aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${label}`}
						className='h-6 w-6 shrink-0'
						onClick={() => onToggleExpanded(node.id)}
						size='icon-sm'
						type='button'
						variant='ghost'
					>
						<ChevronRight
							className={cn(
								'h-4 w-4 transition-transform',
								isExpanded && 'rotate-90'
							)}
						/>
					</Button>
				) : (
					<span aria-hidden='true' className='h-6 w-6 shrink-0' />
				)}
				<Link
					aria-current={isActive ? 'page' : undefined}
					className={cn(
						'min-w-0 flex-1 truncate text-sm underline-offset-4 hover:underline',
						isActive
							? 'font-medium text-foreground'
							: 'text-muted-foreground hover:text-foreground'
					)}
					onClick={() => onNavigate?.()}
					params={{ topicId: node.id.toString() }}
					search={{ tab: 'subtopics' }}
					to='/topics/$topicId'
				>
					{label}
				</Link>
			</div>

			{hasChildren && isExpanded ? (
				<ul className='mt-1 space-y-1'>
					{node.children.map(childNode => (
						<TopicNavigatorItem
							activeTopicId={activeTopicId}
							depth={depth + 1}
							expandedIdSet={expandedIdSet}
							key={childNode.id}
							node={childNode}
							onNavigate={onNavigate}
							onToggleExpanded={onToggleExpanded}
						/>
					))}
				</ul>
			) : null}
		</li>
	)
}

function TopicNavigatorPanel({
	activeTopicId,
	onNavigate
}: {
	activeTopicId?: number | null
	onNavigate?: () => void
}) {
	return (
		<>
			<SidebarHeader className='border-sidebar-border/70'>
				<Button
					className='w-full justify-start'
					nativeButton={false}
					onClick={() => onNavigate?.()}
					render={<Link to='/topics' />}
					variant='ghost'
				>
					<House className='h-4 w-4' />
					Home
				</Button>
				<Separator className='mr-12 w-auto!' />
			</SidebarHeader>
			<SidebarContent className='p-2'>
				<TopicNavigatorContent
					activeTopicId={activeTopicId}
					onNavigate={onNavigate}
				/>
			</SidebarContent>
		</>
	)
}

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
				<TopicNavigatorPanel activeTopicId={activeTopicId} />
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
				<div className='min-h-0 flex-1 overflow-auto px-4 pb-4'>
					<TopicNavigatorPanel
						activeTopicId={activeTopicId}
						onNavigate={() => setOpen(false)}
					/>
				</div>
			</SheetContent>
		</Sheet>
	)
}
