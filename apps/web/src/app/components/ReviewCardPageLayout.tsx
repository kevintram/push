import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { cn } from '~/lib/utils'

type PageTabOption<TValue extends string> = {
	label: string
	count?: ReactNode
	value: TValue
}

type ReviewCardPageLayoutProps<TTab extends string, TScope extends string> = {
	activeTab: TTab
	children: ReactNode
	icon: LucideIcon
	isDueView: boolean
	isFocusedDueView: boolean
	onActiveTabChange: (tab: TTab) => void
	onScopeChange?: (scope: TScope) => void
	scope?: TScope
	scopeOptions?: ReadonlyArray<PageTabOption<TScope>>
	scopeBarActions?: ReactNode
	tabOptions: ReadonlyArray<PageTabOption<TTab>>
	title: string
}

export function ReviewCardPageLayout<
	TTab extends string,
	TScope extends string
>({
	activeTab,
	children,
	icon,
	isDueView,
	isFocusedDueView,
	onActiveTabChange,
	onScopeChange,
	scope,
	scopeOptions,
	scopeBarActions,
	tabOptions,
	title
}: ReviewCardPageLayoutProps<TTab, TScope>) {
	const showScopeTabs =
		isDueView &&
		scope != null &&
		scopeOptions != null &&
		scopeOptions.length > 0 &&
		onScopeChange != null

	const scopeTabs = showScopeTabs ? (
		<Tabs
			className='w-fit'
			onValueChange={value => {
				const nextScope = scopeOptions.find(option => option.value === value)
				if (nextScope) onScopeChange(nextScope.value)
			}}
			value={scope}
		>
			<TabsList variant='badge'>
				{scopeOptions.map(option => (
					<TabsTrigger
						badgeStyle={true}
						key={option.value}
						value={option.value}
					>
						{option.label}
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	) : null
	const scopeBar = showScopeTabs ? (
		<div
			className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'
			data-testid='review-queue-scope-bar'
		>
			{scopeTabs}
			{scopeBarActions ? (
				<div className='flex shrink-0 items-center justify-end'>
					{scopeBarActions}
				</div>
			) : null}
		</div>
	) : null

	return (
		<PageLayout>
			<PageLayout.Header icon={icon} title={title}>
				<div className='flex min-w-0 justify-start'>
					<Tabs
						className='-mb-2 w-fit'
						onValueChange={value => {
							const nextTab = tabOptions.find(option => option.value === value)
							if (nextTab) onActiveTabChange(nextTab.value)
						}}
						value={activeTab}
					>
						<TabsList className='border-b-0' variant='line'>
							{tabOptions.map(option => (
								<TabsTrigger
									className={option.count == null ? undefined : 'gap-2'}
									key={option.value}
									value={option.value}
								>
									<span>{option.label}</span>
									{option.count == null ? null : (
										<span
											aria-hidden='true'
											className='flex items-center gap-1.5'
										>
											{option.count}
										</span>
									)}
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>
				</div>
			</PageLayout.Header>
			<PageLayout.Content
				className={cn(
					'max-w-screen p-4',
					isDueView && 'flex min-h-0 flex-1 flex-col px-2.5 py-2.5 pb-4',
					isFocusedDueView && 'pb-3 sm:pb-4'
				)}
			>
				<div
					className={cn('flex flex-col gap-3', isDueView && 'min-h-0 flex-1')}
				>
					{scopeBar}
					<div className={cn(isDueView && 'min-h-0 flex-1')}>{children}</div>
				</div>
			</PageLayout.Content>
		</PageLayout>
	)
}
