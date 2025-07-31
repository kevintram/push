import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { cn } from '~/lib/utils'

interface ResizableSidebarProps {
	children: React.ReactNode
	isCollapsed: boolean
	onToggleCollapse: () => void
	width: number
	onWidthChange: (width: number) => void
	side: 'left' | 'right'
	minWidth?: number
	maxWidth?: number
}

export function ResizableSidebar({
	children,
	isCollapsed,
	onToggleCollapse,
	width,
	onWidthChange,
	side,
	minWidth = 200,
	maxWidth = 600
}: ResizableSidebarProps) {
	const [isResizing, setIsResizing] = useState(false)
	const sidebarRef = useRef<HTMLDivElement>(null)

	const handleMouseDown = useCallback((mouseDownEvent: React.MouseEvent) => {
		mouseDownEvent.preventDefault()
		setIsResizing(true)
	}, [])

	const handleMouseMove = useCallback(
		(mouseEvent: MouseEvent) => {
			if (!isResizing) {
				return
			}

			const sidebar = sidebarRef.current
			if (!sidebar) {
				return
			}

			const rect = sidebar.getBoundingClientRect()
			let newWidth: number

			if (side === 'left') {
				newWidth = mouseEvent.clientX - rect.left
			} else {
				newWidth = rect.right - mouseEvent.clientX
			}

			newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
			onWidthChange(newWidth)
		},
		[isResizing, side, minWidth, maxWidth, onWidthChange]
	)

	const handleMouseUp = useCallback(() => {
		setIsResizing(false)
	}, [])

	useEffect(() => {
		if (isResizing) {
			document.addEventListener('mousemove', handleMouseMove)
			document.addEventListener('mouseup', handleMouseUp)
			return () => {
				document.removeEventListener('mousemove', handleMouseMove)
				document.removeEventListener('mouseup', handleMouseUp)
			}
		}
	}, [isResizing, handleMouseMove, handleMouseUp])

	if (isCollapsed) {
		return (
			<div
				className={cn(
					'flex flex-none flex-col border-border bg-background',
					side === 'left' ? 'border-r' : 'border-l'
				)}
			>
				<Button
					className='m-2'
					onClick={onToggleCollapse}
					size='icon'
					variant='ghost'
				>
					{side === 'left' ? (
						<ChevronRight className='h-4 w-4' />
					) : (
						<ChevronLeft className='h-4 w-4' />
					)}
				</Button>
			</div>
		)
	}

	return (
		<div
			className={cn(
				'relative flex-none border-border bg-background',
				side === 'left' ? 'border-r' : 'border-l'
			)}
			ref={sidebarRef}
			style={{ width }}
		>
			{children}

			{/* Resize handle */}
			<button
				className={cn(
					'absolute top-0 h-full w-1 cursor-col-resize transition-colors group hover:bg-blue-500/20',
					side === 'left' ? 'right-0' : 'left-0'
				)}
				onMouseDown={handleMouseDown}
				type='button'
			>
				<div
					className={cn(
						'absolute top-1/2 flex h-8 w-3 -translate-y-1/2 items-center justify-center rounded-sm bg-border opacity-0 transition-opacity group-hover:opacity-100',
						side === 'left' ? '-right-1' : '-left-1'
					)}
				>
					<GripVertical className='h-3 w-3' />
				</div>
			</button>
		</div>
	)
}