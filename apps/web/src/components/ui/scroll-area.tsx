import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"

import { cn } from "~/lib/utils"

type ScrollAreaProps = ScrollAreaPrimitive.Root.Props & {
	scrollbarClassName?: string
	thumbClassName?: string
}

function ScrollArea({
	className,
	children,
	scrollbarClassName,
	thumbClassName,
	...props
}: ScrollAreaProps) {
	return (
		<ScrollAreaPrimitive.Root
			className={cn("group/scroll-area relative", className)}
			data-slot='scroll-area'
			{...props}
		>
			<ScrollAreaPrimitive.Viewport
				className='size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1'
				data-slot='scroll-area-viewport'
			>
				{children}
			</ScrollAreaPrimitive.Viewport>
			<ScrollBar
				className={scrollbarClassName}
				thumbClassName={thumbClassName}
			/>
			<ScrollAreaPrimitive.Corner />
		</ScrollAreaPrimitive.Root>
	)
}

function ScrollBar({
	className,
	orientation = "vertical",
	thumbClassName,
	...props
}: ScrollAreaPrimitive.Scrollbar.Props & {
	thumbClassName?: string
}) {
	return (
		<ScrollAreaPrimitive.Scrollbar
			className={cn(
				"flex touch-none select-none p-[3px] transition-colors data-[orientation=horizontal]:h-3.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:border-t data-[orientation=horizontal]:border-t-transparent data-[orientation=horizontal]:bg-transparent data-[orientation=vertical]:h-full data-[orientation=vertical]:w-3.5 data-[orientation=vertical]:border-l data-[orientation=vertical]:border-l-transparent data-[orientation=vertical]:bg-transparent",
				className
			)}
			data-orientation={orientation}
			data-slot='scroll-area-scrollbar'
			keepMounted={true}
			orientation={orientation}
			{...props}
		>
			<ScrollAreaPrimitive.Thumb
				className={cn(
					"relative flex-1 rounded-full bg-foreground/35 transition-colors group-hover/scroll-area:bg-foreground/50 data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full",
					thumbClassName
				)}
				data-slot='scroll-area-thumb'
			/>
		</ScrollAreaPrimitive.Scrollbar>
	)
}

export { ScrollArea, ScrollBar }
