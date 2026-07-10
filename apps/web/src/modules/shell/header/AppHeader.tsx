import { useLocation } from '@tanstack/react-router'
import {
	BookOpen,
	CalendarIcon,
	Clock,
	Flag,
	ListChecks,
	Search,
	Settings,
	X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { BookOpenOff } from '~/components/icons'
import { OPEN_SETTINGS_EVENT } from '~/components/settings-events'
import { SettingsDialog } from '~/components/SettingsDialog'
import { Button } from '~/components/ui/button'
import { SidebarTrigger } from '~/components/ui/sidebar'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { cn } from '~/lib/utils'
import { useReviewCardFlaggedSummary } from '~/modules/review-cards/api/getReviewCardFlaggedSummary'
import { useReviewCardQueueCounts } from '~/modules/review-cards/hooks/useReviewCardQueueCounts'
import { SearchDialog } from '~/modules/search/components/search-dialog/SearchDialog'
import { HeaderIconButton } from '~/modules/shell/header/HeaderIconButton'
import { HeaderNavLink } from '~/modules/shell/header/HeaderNavLink'
import { HeaderArcIndicator } from '~/modules/shell/header/HeaderStatusIndicator'
import { ReviewModeTooltip } from '~/modules/shell/header/ReviewModeTooltip'
import { SearchShortcutHint } from '~/modules/shell/header/SearchShortcutHint'
import { useReviewMode } from '~/stores/ReviewModeContext'

function isEditableTarget(target: EventTarget | null) {
	if (!(target instanceof HTMLElement)) return false

	return (
		target.isContentEditable ||
		target.tagName === 'INPUT' ||
		target.tagName === 'TEXTAREA' ||
		target.tagName === 'SELECT'
	)
}

export function AppHeader() {
	const location = useLocation()
	const { reviewMode, setReviewMode } = useReviewMode()
	const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
	const [searchOpen, setSearchOpen] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const isReviewModeEnabled = reviewMode === 'on'
	const ReviewModeIcon = isReviewModeEnabled ? BookOpen : BookOpenOff
	const { dueTodayCount, newCount, overdueCount } = useReviewCardQueueCounts({
		filter: 'all',
	})
	const flaggedSummaryQuery = useReviewCardFlaggedSummary()
	const flaggedCount = flaggedSummaryQuery?.data?.flaggedCount ?? 0

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
				event.preventDefault()
				setSearchOpen(true)
				return
			}

			if (
				event.defaultPrevented ||
				event.repeat ||
				event.isComposing ||
				event.metaKey ||
				event.ctrlKey ||
				event.altKey ||
				event.shiftKey ||
				isEditableTarget(event.target) ||
				event.key.toLowerCase() !== 'r'
			) {
				return
			}

			event.preventDefault()
			setReviewMode(isReviewModeEnabled ? 'off' : 'on')
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [isReviewModeEnabled, setReviewMode])

	useEffect(() => {
		const handleOpenSettings = () => setIsSettingsDialogOpen(true)

		window.addEventListener(OPEN_SETTINGS_EVENT, handleOpenSettings)
		return () =>
			window.removeEventListener(OPEN_SETTINGS_EVENT, handleOpenSettings)
	}, [])

	return (
		<>
			<header className='grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 bg-transparent px-2 py-1 sm:px-2 sm:py-1.5'>
				<div className='flex min-w-0 items-center gap-2'>
					<SidebarTrigger className='rounded-full' />
				</div>

				<div className='flex min-w-0 justify-center'>
					<div className='flex w-[min(21rem,calc(100vw-6.5rem))] items-center gap-0.5 sm:w-[min(21rem,calc(100vw-8rem))]'>
						<div className='relative min-w-0 flex-1'>
							<Button
								aria-label='Open search'
								className='w-full justify-start hover:bg-[var(--app-chrome-hover)] active:border-[var(--app-chrome-border)] active:bg-[var(--app-chrome-selected)]'
								onClick={() => setSearchOpen(true)}
								size='sm'
								variant='outline'
							>
								<Search className='text-muted-foreground' />
								<span
									className={cn(
										'min-w-0 flex-1 truncate text-left font-normal text-muted-foreground',
										searchQuery && 'text-foreground',
									)}
								>
									{searchQuery || 'Search'}
								</span>
								{searchQuery ? null : <SearchShortcutHint />}
							</Button>
							{searchQuery ? (
								<Button
									aria-label='Clear search'
									className='absolute top-1/2 right-0.5 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-[var(--app-chrome-hover)] hover:text-[var(--app-chrome-hover-foreground)] active:border-[var(--app-chrome-border)] active:bg-[var(--app-chrome-selected)] active:text-[var(--app-chrome-selected-foreground)]'
									onClick={event => {
										event.stopPropagation()
										setSearchQuery('')
									}}
									size='icon-xs'
									type='button'
									variant='ghost'
								>
									<X />
								</Button>
							) : null}
						</div>
						<Tooltip>
							<TooltipTrigger
								render={
									<HeaderIconButton
										ariaLabel={`Review mode ${isReviewModeEnabled ? 'on' : 'off'}`}
										className={cn(
											'size-7.5 px-0',
											isReviewModeEnabled &&
												'border-blue-200 bg-blue-50 text-blue-700 shadow-xs hover:border-blue-300 hover:bg-blue-100 hover:text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-200 dark:hover:bg-blue-900/70',
										)}
										onClick={() =>
											setReviewMode(
												isReviewModeEnabled
													? 'off'
													: 'on',
											)
										}
										showNativeTitle={false}
										variant='outline'
									/>
								}
							>
								<ReviewModeIcon />
							</TooltipTrigger>
							<TooltipContent>
								<ReviewModeTooltip
									isEnabled={isReviewModeEnabled}
								/>
							</TooltipContent>
						</Tooltip>
					</div>
				</div>

				<div className='flex min-w-0 items-center justify-end gap-0'>
					<HeaderNavLink
						icon={CalendarIcon}
						isActive={location.pathname.startsWith('/due')}
						label='Due'
						rawIndicator={
							<HeaderArcIndicator
								dueTodayCount={dueTodayCount}
								neutralVariant='solid'
								overdueCount={overdueCount}
								pendingCount={newCount}
								testIdPrefix='header-due'
							/>
						}
						to='/due'
					/>
					<HeaderNavLink
						icon={Flag}
						isActive={location.pathname === '/flagged'}
						label='Flagged'
						rawIndicator={
							<HeaderArcIndicator
								dueTodayCount={0}
								neutralVariant='solid'
								overdueCount={0}
								pendingCount={flaggedCount}
								testIdPrefix='header-flagged'
							/>
						}
						to='/flagged'
					/>
					<HeaderNavLink
						icon={Clock}
						isActive={location.pathname === '/recent'}
						label='Recent'
						to='/recent'
					/>
					<HeaderNavLink
						icon={ListChecks}
						isActive={location.pathname === '/logbook'}
						label='Logbook'
						to='/logbook'
					/>
					<Tooltip>
						<TooltipTrigger
							render={
								<HeaderIconButton
									ariaLabel='Settings'
									className='size-7.5 px-0'
									onClick={() =>
										setIsSettingsDialogOpen(true)
									}
									showNativeTitle={false}
								/>
							}
						>
							<Settings />
						</TooltipTrigger>
						<TooltipContent>Settings</TooltipContent>
					</Tooltip>
				</div>
			</header>

			<SearchDialog
				onOpenChange={setSearchOpen}
				open={searchOpen}
				query={searchQuery}
				setQuery={setSearchQuery}
			/>
			<SettingsDialog
				onOpenChange={setIsSettingsDialogOpen}
				open={isSettingsDialogOpen}
			/>
		</>
	)
}
