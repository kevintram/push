import { cn } from '~/lib/utils'

interface ProgressProps {
	value: number
	max?: number
	className?: string
}

export function Progress({ value, max = 100, className }: ProgressProps) {
	const percentage = Math.min((value / max) * 100, 100)

	return (
		<div className={cn('h-2 w-24 rounded-full bg-muted', className)}>
			<div
				className='h-full rounded-full bg-primary transition-all duration-300 ease-in-out'
				style={{ width: `${percentage}%` }}
			/>
		</div>
	)
}
