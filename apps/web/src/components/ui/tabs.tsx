import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

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

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
	return (
		<TabsPrimitive.Tab
			className={cn(
				"inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2 py-1 font-medium text-foreground text-sm transition-[color,box-shadow] focus-visible:border-ring focus-visible:outline-1 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[orientation=vertical]:w-full data-[orientation=vertical]:justify-start data-active:bg-background data-active:shadow-sm dark:text-muted-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground [&_svg:not([class*=size])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				"group-data-[variant=line]/tabs-list:relative group-data-[variant=line]/tabs-list:h-10 group-data-[variant=line]/tabs-list:flex-none group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:border-0 group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:px-3 group-data-[variant=line]/tabs-list:py-0 group-data-[variant=line]/tabs-list:text-muted-foreground group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:text-foreground group-data-[variant=line]/tabs-list:data-active:shadow-none group-data-[variant=line]/tabs-list:dark:data-active:bg-transparent group-data-[variant=line]/tabs-list:dark:data-active:border-transparent group-data-[variant=line]/tabs-list:after:absolute group-data-[variant=line]/tabs-list:after:bottom-[-1px] group-data-[variant=line]/tabs-list:after:left-0 group-data-[variant=line]/tabs-list:after:h-0.5 group-data-[variant=line]/tabs-list:after:w-full group-data-[variant=line]/tabs-list:after:bg-foreground group-data-[variant=line]/tabs-list:after:opacity-0 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
				className
			)}
			data-slot='tabs-trigger'
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

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
