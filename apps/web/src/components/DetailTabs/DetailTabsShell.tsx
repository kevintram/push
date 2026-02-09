import type { ReactNode } from 'react'
import { CountBadge } from '~/components/ui/CountBadge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { cn } from '~/lib/utils'

export interface DetailTabDefinition {
	value: string
	label: string
	count: number
	content: ReactNode
}

interface DetailTabsShellProps {
	tabs: Array<DetailTabDefinition>
	defaultValue?: string
	className?: string
}

export function DetailTabsShell({
	tabs,
	defaultValue,
	className
}: DetailTabsShellProps) {
	if (tabs.length === 0) return null

	const resolvedDefaultValue = defaultValue ?? tabs[0]?.value

	return (
		<Tabs
			className={cn('gap-4', className)}
			defaultValue={resolvedDefaultValue}
		>
			<div className='w-full border-border border-b'>
				<TabsList
					className='h-auto w-fit rounded-none bg-transparent p-0'
					variant='line'
				>
					{tabs.map(tab => (
						<TabsTrigger
							className='!flex-none h-10 gap-2 rounded-none border-0 px-3 text-muted-foreground data-[state=active]:text-foreground group-data-[orientation=horizontal]/tabs:after:bottom-[-1px]'
							key={tab.value}
							value={tab.value}
						>
							<span>{tab.label}</span>
							<CountBadge
								className='h-4 min-w-4 text-[10px]'
								count={tab.count}
							/>
						</TabsTrigger>
					))}
				</TabsList>
			</div>
			{tabs.map(tab => (
				<TabsContent className='mt-0' key={tab.value} value={tab.value}>
					{tab.content}
				</TabsContent>
			))}
		</Tabs>
	)
}
