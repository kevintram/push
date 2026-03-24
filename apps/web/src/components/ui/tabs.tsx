import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { Badge } from "~/components/ui/badge"
import { cn } from "~/lib/utils"

function Tabs({
	className,
	orientation = "horizontal",
	...props
}: TabsPrimitive.Root.Props) {
	return (
		<TabsPrimitive.Root
			className={cn(
				"group/tabs flex flex-col gap-2 data-[orientation=vertical]:flex-row",
				className
			)}
			data-orientation={orientation}
			data-slot='tabs'
			orientation={orientation}
			{...props}
		/>
	)
}

const tabsListVariants = cva(
	"group/tabs-list text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px] data-[orientation=vertical]:h-fit data-[orientation=vertical]:flex-col",
	{
		variants: {
			variant: {
				badge: "h-auto gap-2 bg-transparent p-0",
				default: "bg-muted",
				line: "h-auto w-full justify-start gap-1 rounded-none border-border border-b bg-transparent p-0"
			}
		},
		defaultVariants: {
			variant: "default"
		}
	}
)

function TabsList({
	className,
	variant = "default",
	...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
	return (
		<TabsPrimitive.List
			className={cn(tabsListVariants({ variant }), className)}
			data-slot='tabs-list'
			data-variant={variant}
			{...props}
		/>
	)
}

type TabsTriggerProps = TabsPrimitive.Tab.Props & {
	badgeStyle?: boolean
}

function TabsTrigger({
	badgeStyle = false,
	className,
	render,
	...props
}: TabsTriggerProps) {
	const badgeRender = (
		<Badge render={<button type='button' />} variant='secondary' />
	)

	return (
		<TabsPrimitive.Tab
			className={cn(
				"focus-visible:border-ring focus-visible:outline-ring focus-visible:ring-ring/50 text-foreground/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2 py-1 font-medium text-sm transition-all data-[orientation=vertical]:w-full data-[orientation=vertical]:justify-start focus-visible:outline-1 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 data-active:bg-background data-active:text-foreground data-active:shadow-sm dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground [&_svg:not([class*=size])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				"group-data-[variant=badge]/tabs-list:h-auto group-data-[variant=badge]/tabs-list:flex-none group-data-[variant=badge]/tabs-list:rounded-lg group-data-[variant=badge]/tabs-list:border-0 group-data-[variant=badge]/tabs-list:px-2.5 group-data-[variant=badge]/tabs-list:py-1 group-data-[variant=badge]/tabs-list:font-semibold group-data-[variant=badge]/tabs-list:text-foreground/80 group-data-[variant=badge]/tabs-list:shadow-none group-data-[variant=badge]/tabs-list:data-active:border-transparent group-data-[variant=badge]/tabs-list:data-active:bg-foreground group-data-[variant=badge]/tabs-list:data-active:text-background dark:group-data-[variant=badge]/tabs-list:bg-muted dark:group-data-[variant=badge]/tabs-list:data-active:bg-foreground dark:group-data-[variant=badge]/tabs-list:data-active:text-background",
				"group-data-[variant=line]/tabs-list:relative group-data-[variant=line]/tabs-list:h-10 group-data-[variant=line]/tabs-list:flex-none group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:border-0 group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:px-3 group-data-[variant=line]/tabs-list:py-0 group-data-[variant=line]/tabs-list:text-muted-foreground group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:text-foreground group-data-[variant=line]/tabs-list:data-active:shadow-none group-data-[variant=line]/tabs-list:dark:data-active:bg-transparent group-data-[variant=line]/tabs-list:dark:data-active:border-transparent group-data-[variant=line]/tabs-list:after:absolute group-data-[variant=line]/tabs-list:after:bottom-[-1px] group-data-[variant=line]/tabs-list:after:left-0 group-data-[variant=line]/tabs-list:after:h-0.5 group-data-[variant=line]/tabs-list:after:w-full group-data-[variant=line]/tabs-list:after:bg-foreground group-data-[variant=line]/tabs-list:after:opacity-0 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
				className
			)}
			data-slot='tabs-trigger'
			render={badgeStyle ? (render ?? badgeRender) : render}
			{...props}
		/>
	)
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
	return (
		<TabsPrimitive.Panel
			className={cn("flex-1 text-sm outline-none", className)}
			data-slot='tabs-content'
			{...props}
		/>
	)
}

export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants }
