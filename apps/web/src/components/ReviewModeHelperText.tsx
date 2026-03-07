import { AlertTriangle } from 'lucide-react'
import { cn } from '~/lib/utils'

type ReviewModeHelperTextProps = {
	variant: 'guess' | 'autosave'
	className?: string
}

export function ReviewModeHelperText({
	variant,
	className
}: ReviewModeHelperTextProps) {
	if (variant === 'guess') {
		return (
			<p
				className={cn(
					'flex items-center justify-end gap-1 text-muted-foreground text-xs',
					className
				)}
			>
				<AlertTriangle className='h-3 w-3 shrink-0 text-amber-500 dark:text-amber-400' />
				<span>Guesses are not saved.</span>
			</p>
		)
	}

	return (
		<p className={cn('text-right text-muted-foreground text-xs', className)}>
			Changes are automatically saved.
		</p>
	)
}
