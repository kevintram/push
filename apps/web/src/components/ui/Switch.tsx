import * as SwitchPrimitive from '@radix-ui/react-switch'
import type * as React from 'react'

import { cn } from '~/lib/utils'

const switchSizes = {
	xs: {
		root: 'h-[0.92rem] w-6',
		thumb: 'size-[0.8rem]'
	},
	sm: {
		root: 'h-[1.04rem] w-7',
		thumb: 'size-[0.9rem]'
	},
	md: {
		root: 'h-[1.15rem] w-8',
		thumb: 'size-4'
	}
}

interface SwitchProps
	extends React.ComponentProps<typeof SwitchPrimitive.Root> {
	size?: 'xs' | 'sm' | 'md'
}

function Switch({ className, size = 'md', ...props }: SwitchProps) {
	return (
		<SwitchPrimitive.Root
			className={cn(
				'peer inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80',
				switchSizes[size].root,
				className
			)}
			data-slot='switch'
			{...props}
		>
			<SwitchPrimitive.Thumb
				className={cn(
					'pointer-events-none block rounded-full bg-background ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0 dark:bg-foreground',
					switchSizes[size].thumb
				)}
				data-slot='switch-thumb'
			/>
		</SwitchPrimitive.Root>
	)
}

export { Switch }
