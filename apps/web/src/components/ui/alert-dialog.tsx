import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react"
import type * as React from "react"
import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"

function AlertDialog({ ...props }: AlertDialogPrimitive.Root.Props) {
	return <AlertDialogPrimitive.Root data-slot='alert-dialog' {...props} />
}

function AlertDialogTrigger({ ...props }: AlertDialogPrimitive.Trigger.Props) {
	return (
		<AlertDialogPrimitive.Trigger data-slot='alert-dialog-trigger' {...props} />
	)
}

function AlertDialogPortal({ ...props }: AlertDialogPrimitive.Portal.Props) {
	return (
		<AlertDialogPrimitive.Portal data-slot='alert-dialog-portal' {...props} />
	)
}

function AlertDialogOverlay({
	className,
	...props
}: AlertDialogPrimitive.Backdrop.Props) {
	return (
		<AlertDialogPrimitive.Backdrop
			className={cn(
				"data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs",
				className
			)}
			data-slot='alert-dialog-overlay'
			{...props}
		/>
	)
}

function AlertDialogContent({
	className,
	children,
	size = "default",
	...props
}: AlertDialogPrimitive.Popup.Props & {
	size?: "default" | "sm"
}) {
	return (
		<AlertDialogPortal>
			<AlertDialogOverlay />
			<AlertDialogPrimitive.Popup
				className={cn(
					"bg-background data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl p-6 text-sm shadow-lg ring-1 ring-foreground/10 duration-100 outline-none",
					size === "sm" ? "sm:max-w-sm" : "sm:max-w-md",
					className
				)}
				data-slot='alert-dialog-content'
				{...props}
			>
				{children}
			</AlertDialogPrimitive.Popup>
		</AlertDialogPortal>
	)
}

function AlertDialogHeader({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("flex flex-col gap-2", className)}
			data-slot='alert-dialog-header'
			{...props}
		/>
	)
}

function AlertDialogMedia({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive",
				className
			)}
			data-slot='alert-dialog-media'
			{...props}
		/>
	)
}

function AlertDialogFooter({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
				className
			)}
			data-slot='alert-dialog-footer'
			{...props}
		/>
	)
}

function AlertDialogTitle({
	className,
	...props
}: AlertDialogPrimitive.Title.Props) {
	return (
		<AlertDialogPrimitive.Title
			className={cn("font-medium leading-none", className)}
			data-slot='alert-dialog-title'
			{...props}
		/>
	)
}

function AlertDialogDescription({
	className,
	...props
}: AlertDialogPrimitive.Description.Props) {
	return (
		<AlertDialogPrimitive.Description
			className={cn("text-muted-foreground text-sm", className)}
			data-slot='alert-dialog-description'
			{...props}
		/>
	)
}

type AlertDialogButtonProps = AlertDialogPrimitive.Close.Props & {
	buttonClassName?: string
}

function AlertDialogAction({
	buttonClassName,
	...props
}: AlertDialogButtonProps) {
	return (
		<AlertDialogPrimitive.Close
			data-slot='alert-dialog-action'
			render={<Button className={buttonClassName} variant='destructive' />}
			{...props}
		/>
	)
}

function AlertDialogCancel({
	buttonClassName,
	...props
}: AlertDialogButtonProps) {
	return (
		<AlertDialogPrimitive.Close
			data-slot='alert-dialog-cancel'
			render={<Button className={buttonClassName} variant='outline' />}
			{...props}
		/>
	)
}

export {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogOverlay,
	AlertDialogPortal,
	AlertDialogTitle,
	AlertDialogTrigger
}
