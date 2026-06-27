import { Loader } from "lucide-react"

import { cn } from "~/lib/utils"

type LoadingSpinnerSize = "sm" | "md" | "lg"

interface LoadingSpinnerProps {
	containerClassName?: string
	iconClassName?: string
	label?: string
	size?: LoadingSpinnerSize
}

const iconSizeClass: Record<LoadingSpinnerSize, string> = {
	sm: "h-4 w-4",
	md: "h-6 w-6",
	lg: "h-8 w-8",
}

export function LoadingSpinner({
	containerClassName,
	iconClassName,
	label,
	size = "md",
}: LoadingSpinnerProps) {
	return (
		<div
			aria-busy='true'
			aria-live='polite'
			className={cn(
				"flex items-center justify-center gap-2 py-6 text-muted-foreground",
				containerClassName,
			)}
		>
			<Loader
				className={cn(
					"animate-spin",
					iconSizeClass[size],
					iconClassName,
				)}
			/>
			{label ? <span className='text-sm'>{label}</span> : null}
			{label ? null : <span className='sr-only'>Loading</span>}
		</div>
	)
}
