import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { CheckIcon } from 'lucide-react'
import type * as React from 'react'

import { cn } from '~/lib/utils'

function SessionCheckbox({
	className,
	...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
	return (
		<CheckboxPrimitive.Root
			className={cn(
				'peer size-4 shrink-0 cursor-pointer rounded-full border border-blue-400 shadow-xs outline-none transition-shadow focus-visible:border-blue-500 focus-visible:ring-[3px] focus-visible:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white dark:border-blue-500 dark:bg-blue-500/10 dark:data-[state=checked]:bg-blue-500',
				className
			)}
			data-slot='session-checkbox'
			{...props}
		>
			<CheckboxPrimitive.Indicator
				className='flex cursor-pointer items-center justify-center text-current transition-none'
				data-slot='session-checkbox-indicator'
			>
				<CheckIcon className='size-3.5 cursor-pointer' />
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	)
}

export { SessionCheckbox }
