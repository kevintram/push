import { cn } from '~/lib/utils'

interface ProgressProps {
	value: number
	max?: number
	className?: string
}

export function Progress({ value, max = 100, className }: ProgressProps) {
	const percentage = Math.min((value / max) * 100, 100)
	
	return (
		<div className={cn("w-24 h-2 bg-muted rounded-full", className)}>
			<div 
				className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out" 
				style={{ width: `${percentage}%` }}
			/>
		</div>
	)
}