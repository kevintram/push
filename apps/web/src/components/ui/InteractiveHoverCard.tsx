import type { ReactNode } from 'react'
import { useCallback, useRef, useState } from 'react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './HoverCard'

interface InteractiveHoverCardProps {
	children: ReactNode
	content: ReactNode
	openDelay?: number
	side?: 'top' | 'bottom' | 'left' | 'right'
	contentClassName?: string
}

export function InteractiveHoverCard({
	children,
	content,
	openDelay = 300,
	side = 'bottom',
	contentClassName
}: InteractiveHoverCardProps) {
	const [open, setOpen] = useState(false)
	const clickedRef = useRef(false)

	const handleOpenChange = useCallback((newOpen: boolean) => {
		if (!newOpen && clickedRef.current) {
			clickedRef.current = false
			return // Prevent close after click
		}
		setOpen(newOpen)
	}, [])

	const handleClick = useCallback(() => {
		clickedRef.current = true
		setOpen(true)
	}, [])

	return (
		<HoverCard
			onOpenChange={handleOpenChange}
			open={open}
			openDelay={openDelay}
		>
			<HoverCardTrigger asChild={true} onClick={handleClick}>
				{children}
			</HoverCardTrigger>
			<HoverCardContent className={contentClassName} side={side}>
				{content}
			</HoverCardContent>
		</HoverCard>
	)
}
