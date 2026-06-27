import { type ReactNode } from "react"
import { isValidElement, useCallback, useRef, useState } from "react"

import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card"

interface InteractiveHoverCardProps {
	children: ReactNode
	content: ReactNode
	openDelay?: number
	side?: "top" | "bottom" | "left" | "right"
	contentClassName?: string
}

export function InteractiveHoverCard({
	children,
	content,
	openDelay = 300,
	side = "bottom",
	contentClassName,
}: InteractiveHoverCardProps) {
	const [open, setOpen] = useState(false)
	const clickedRef = useRef(false)
	const triggerElement = isValidElement(children) ? (
		children
	) : (
		<span>{children}</span>
	)

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
			<HoverCardTrigger onClick={handleClick} render={triggerElement} />
			<HoverCardContent className={contentClassName} side={side}>
				{content}
			</HoverCardContent>
		</HoverCard>
	)
}
