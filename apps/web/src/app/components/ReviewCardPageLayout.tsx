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
	centerFocusedContent?: boolean
	children: ReactNode
	icon: LucideIcon
	isDueView: boolean
	isFocusedDueView: boolean
	onActiveTabChange: (tab: TTab) => void
	overlayFocusedScopeTabs?: boolean
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
	centerFocusedContent = true,
	children,
	icon,
	isDueView,
	isFocusedDueView,
	onActiveTabChange,
	overlayFocusedScopeTabs = true,
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
	const shouldOverlayScopeTabs =
		showScopeTabs && isFocusedDueView && overlayFocusedScopeTabs

	const scopeTabs = showScopeTabs ? (
		<Tabs
			className={cn('w-fit', shouldOverlayScopeTabs && 'pointer-events-none')}
			onValueChange={value => {
				const nextScope = scopeOptions.find(option => option.value === value)
				if (nextScope) onScopeChange(nextScope.value)
			}}
			value={scope}
		>
			<TabsList
				className={cn(shouldOverlayScopeTabs && 'pointer-events-auto')}
				variant='badge'
			>
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
		<div className='flex items-center justify-between gap-4'>
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
									className={option.count != null ? 'gap-2' : undefined}
									key={option.value}
									value={option.value}
								>
									<span>{option.label}</span>
									{option.count != null ? (
										<span
											aria-hidden='true'
											className='flex items-center gap-1.5'
										>
											{option.count}
										</span>
									) : null}
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>
				</div>
			</PageLayout.Header>
			<PageLayout.Content
				className={cn(
					'max-w-screen p-6',
					isDueView && 'px-3 pt-3 pb-6',
					isFocusedDueView && 'pb-4 sm:pb-6',
					isDueView && 'flex min-h-0 flex-1 flex-col'
				)}
			>
				{shouldOverlayScopeTabs ? (
					<div className='relative min-h-0 flex-1'>
						<div className='absolute top-0 left-0 z-10 w-full'>{scopeBar}</div>
						<div
							className={cn(
								'flex h-full min-h-0 flex-1',
								centerFocusedContent && 'items-center justify-center'
							)}
						>
							{children}
						</div>
					</div>
				) : (
					<div
						className={cn('flex flex-col gap-4', isDueView && 'min-h-0 flex-1')}
					>
						{scopeBar}
						<div className={cn(isDueView && 'min-h-0 flex-1')}>{children}</div>
					</div>
				)}
			</PageLayout.Content>
		</PageLayout>
	)
}
