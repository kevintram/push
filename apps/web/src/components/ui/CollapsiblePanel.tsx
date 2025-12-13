import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

interface CollapsiblePanelProps {
	icon: ReactNode
	title: string
	count: number
	isCollapsed: boolean
	onToggleCollapse?: () => void
	addButton: ReactNode
	children: ReactNode
	textSize?: 'sm' | 'md'
}

export function CollapsiblePanel({
	icon,
	title,
	count,
	isCollapsed,
	onToggleCollapse,
	addButton,
	children,
	textSize = 'md'
}: CollapsiblePanelProps) {
	return (
		<div className='flex flex-col'>
			<div className='flex items-center gap-2 border-b-1 pb-1'>
				<Button
					className='flex items-center gap-2 p-0'
					onClick={onToggleCollapse ?? (() => {})}
					variant='ghost'
				>
					{icon}
					<span
						className={`font-medium text-${textSize} text-muted-foreground`}
					>
						{title} ({count})
					</span>
					<ChevronDown
						className={`h-4 w-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
					/>
				</Button>
				<div className='flex-1' />
				{addButton}
			</div>
			{!isCollapsed && <div className='flex-1 py-6'>{children}</div>}
		</div>
	)
}
