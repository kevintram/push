import type { ReactNode } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { Button } from '~/components/ui/button'
import { CountBadge } from '~/components/ui/count-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { cn } from '~/lib/utils'

function TabErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
	return (
		<div className='flex flex-col items-center gap-3 py-6 text-center'>
			<p className='text-muted-foreground text-sm'>
				{error?.message || 'Something went wrong loading this tab.'}
			</p>
			<Button onClick={resetErrorBoundary} size='sm' variant='outline'>
				Retry
			</Button>
		</div>
	)
}

export interface DetailTabDefinition {
	value: string
	label: string
	count: number
	content: ReactNode
}

interface DetailTabsShellProps {
	tabs: Array<DetailTabDefinition>
	defaultValue?: string
	value?: string
	onValueChange?: (value: string) => void
	className?: string
}

export function DetailTabsShell({
	tabs,
	defaultValue,
	value,
	onValueChange,
	className
}: DetailTabsShellProps) {
	if (tabs.length === 0) return null

	const resolvedDefaultValue = defaultValue ?? tabs[0]?.value

	return (
		<Tabs
			className={cn('gap-4', className)}
			defaultValue={resolvedDefaultValue}
			onValueChange={onValueChange}
			value={value}
		>
			<TabsList variant='line'>
				{tabs.map(tab => (
					<TabsTrigger className='gap-2' key={tab.value} value={tab.value}>
						<span>{tab.label}</span>
						<CountBadge className='h-4 min-w-4 text-[10px]' count={tab.count} />
					</TabsTrigger>
				))}
			</TabsList>
			{tabs.map(tab => (
				<TabsContent className='mt-0' key={tab.value} value={tab.value}>
					<ErrorBoundary FallbackComponent={TabErrorFallback}>
						{tab.content}
					</ErrorBoundary>
				</TabsContent>
			))}
		</Tabs>
	)
}
