import {
	CircleCheckIcon,
	InfoIcon,
	Loader2Icon,
	OctagonXIcon,
	TriangleAlertIcon
} from "lucide-react"
import type React from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useTheme } from "~/stores/ThemeContext"

const Toaster = ({ ...props }: ToasterProps) => {
	const { resolvedTheme } = useTheme()
	const toasterTheme = resolvedTheme ?? "system"

	return (
		<Sonner
			className='toaster group'
			icons={{
				success: <CircleCheckIcon className='size-4' />,
				info: <InfoIcon className='size-4' />,
				warning: <TriangleAlertIcon className='size-4' />,
				error: <OctagonXIcon className='size-4' />,
				loading: <Loader2Icon className='size-4 animate-spin' />
			}}
			position='top-center'
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
					"--border-radius": "var(--radius)"
				} as React.CSSProperties
			}
			theme={toasterTheme as ToasterProps["theme"]}
			toastOptions={{
				classNames: {
					toast: "cn-toast"
				}
			}}
			{...props}
		/>
	)
}

export { Toaster }
