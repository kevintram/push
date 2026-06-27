import { type ComponentProps } from 'react'

import { Button } from '~/components/ui/button'
import { Kbd } from '~/components/ui/kbd'
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
			className={cn(
				'rounded-xl text-muted-foreground hover:bg-[var(--app-chrome-hover)] hover:text-[var(--app-chrome-hover-foreground)] active:border-[var(--app-chrome-border)] active:bg-[var(--app-chrome-selected)] active:text-[var(--app-chrome-selected-foreground)] aria-pressed:border-[var(--app-chrome-border)] aria-pressed:bg-[var(--app-chrome-selected)] aria-pressed:text-[var(--app-chrome-selected-foreground)]',
				className,
			)}
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
			<div className='flex items-center gap-2'>
				<span className='font-medium'>
					Review mode {isEnabled ? 'on' : 'off'}
				</span>
				<Kbd className=''>R</Kbd>
			</div>
			<span className='text-background/70'>
				{isEnabled
					? 'Answers are hidden until you reveal them'
					: 'Hide answers and test your recall'}
			</span>
		</div>
	)
}
