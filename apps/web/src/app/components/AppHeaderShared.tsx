import type { ComponentProps } from 'react'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

export function HeaderIconButton({
	ariaLabel,
	children,
	className,
	showNativeTitle = true,
	...props
}: ComponentProps<typeof Button> & {
	ariaLabel: string
	showNativeTitle?: boolean
}) {
	return (
		<Button
			aria-label={ariaLabel}
			className={cn('rounded-xl', className)}
			size='sm'
			title={showNativeTitle ? ariaLabel : undefined}
			variant='ghost'
			{...props}
		>
			{children}
		</Button>
	)
}

export function ReviewModeTooltip({ isEnabled }: { isEnabled: boolean }) {
	return (
		<div className='flex flex-col gap-0.5'>
			<span className='font-medium'>
				Review mode {isEnabled ? 'on' : 'off'}
			</span>
			<span className='text-background/70'>
				{isEnabled
					? 'Answers are hidden until you reveal them'
					: 'Hide answers and test your recall'}
			</span>
		</div>
	)
}
