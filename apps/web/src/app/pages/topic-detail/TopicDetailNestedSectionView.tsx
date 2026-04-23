import {
	ChevronDown,
	ExternalLink,
	Loader,
	MoreHorizontal,
	Plus,
	Trash2
} from 'lucide-react'
import { type ChangeEventHandler, type ReactNode, useState } from 'react'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/tooltip'
import { cn } from '~/lib/utils'
import {
	getTopicDetailSectionDisplayLevel,
	TOPIC_DETAIL_SECTION_GRID_CLASS
} from './topicDetailLayout'
import type { TopicDetailSectionNode } from './topicDetailStructure'

function getActionButtonProps(section: TopicDetailSectionNode) {
	const displayLevel = getTopicDetailSectionDisplayLevel(section)
	if (displayLevel <= 4) {
		return {
			buttonSize: 'icon-sm' as const
		}
	}
	return {
		buttonSize: 'icon-xs' as const
	}
}

interface TopicDetailNestedSectionViewProps {
	bodyPanel: ReactNode
	contentTopSpacingClassName: string
	flushTitle: () => void
	headingClassName: string
	isCollapsed: boolean
	isCreatingTopic: boolean
	isFreshTopic: boolean
	onCreateSubtopic: () => Promise<void>
	onOpenDeleteDialog: () => void
	onOpenTopic: () => void
	onTitleChange: ChangeEventHandler<HTMLTextAreaElement>
	registerHeadingRef: (element: HTMLDivElement | null) => void
	registerTitleRef: (element: HTMLTextAreaElement | null) => void
	reviewCardsSection: ReactNode
	section: TopicDetailSectionNode
	sectionId: string
	sectionLabel: string
	sectionNumber: string | null
	title: string
	toggleSection: (sectionId: string) => void
}

export function TopicDetailNestedSectionView({
	bodyPanel,
	contentTopSpacingClassName,
	flushTitle,
	headingClassName,
	isCollapsed,
	isCreatingTopic,
	isFreshTopic,
	onCreateSubtopic,
	onOpenDeleteDialog,
	onOpenTopic,
	onTitleChange,
	registerHeadingRef,
	registerTitleRef,
	reviewCardsSection,
	section,
	sectionId,
	sectionLabel,
	sectionNumber,
	title,
	toggleSection
}: TopicDetailNestedSectionViewProps) {
	const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const { buttonSize } = getActionButtonProps(section)
	const showsInlineNumber = sectionNumber != null

	return (
		<div
			className={cn(
				'group/section transition-[background-color,box-shadow] duration-400 ease-out',
				TOPIC_DETAIL_SECTION_GRID_CLASS,
				isFreshTopic &&
					'-mx-3 rounded-xl bg-sky-50/70 px-3 py-2 ring-1 ring-sky-200/80 dark:bg-sky-950/20 dark:ring-sky-800/70'
			)}
			data-fresh-topic={isFreshTopic ? 'true' : undefined}
		>
			<div aria-hidden='true' />
			<div
				className='relative min-w-0 scroll-mt-24'
				data-topic-detail-heading-id={section.topic.id}
				ref={registerHeadingRef}
			>
				<div className='flex min-w-0 items-start gap-2'>
					<div
						aria-level={section.headingLevel}
						className='min-w-0 flex-1'
						role='heading'
					>
						<div
							className={cn(
								'flex min-w-0 gap-x-3',
								showsInlineNumber ? 'items-baseline' : 'items-start'
							)}
						>
							{showsInlineNumber ? (
								<span
									aria-hidden='true'
									className={cn(
										headingClassName,
										'block shrink-0 select-none whitespace-nowrap text-slate-400 dark:text-slate-500'
									)}
								>
									{sectionNumber}
								</span>
							) : null}
							<div className='relative min-w-0'>
								<span
									aria-hidden='true'
									className={cn(
										'block whitespace-pre-wrap break-words',
										headingClassName,
										title.trim().length === 0 && 'text-transparent'
									)}
								>
									{title.trim().length > 0 ? title : '\u00A0'}
								</span>
								<textarea
									aria-label={`Topic title ${section.topic.id}`}
									className={cn(
										'absolute inset-0 m-0 block min-h-0 w-full min-w-0 resize-none overflow-hidden border-none bg-transparent p-0 text-transparent caret-current outline-none selection:bg-slate-200/80 selection:text-transparent placeholder:text-muted-foreground dark:selection:bg-slate-700/70',
										headingClassName
									)}
									onBlur={flushTitle}
									onChange={onTitleChange}
									placeholder='Title'
									ref={registerTitleRef}
									rows={1}
									spellCheck={false}
									value={title}
								/>
							</div>
						</div>
					</div>
					<div className='flex shrink-0 items-center gap-0.5'>
						<div className='pointer-events-none flex items-center gap-0.5 opacity-0 transition-opacity group-hover/section:pointer-events-auto group-hover/section:opacity-100 group-has-[:focus-visible]/section:pointer-events-auto group-has-[:focus-visible]/section:opacity-100'>
							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											aria-label={`Open ${sectionLabel}`}
											className='shrink-0 rounded-full'
											onClick={onOpenTopic}
											size={buttonSize}
											type='button'
											variant='ghost'
										>
											<ExternalLink />
										</Button>
									}
								/>
								<TooltipContent>Open topic</TooltipContent>
							</Tooltip>
							<DropdownMenu
								onOpenChange={nextOpen => {
									if (isSubmitting) return
									setIsActionsMenuOpen(nextOpen)
								}}
								open={isActionsMenuOpen}
							>
								<DropdownMenuTrigger
									render={
										<Button
											aria-label={`More actions for ${sectionLabel}`}
											className='shrink-0 rounded-full'
											size={buttonSize}
											variant='ghost'
										>
											<MoreHorizontal />
										</Button>
									}
								/>
								<DropdownMenuContent align='end'>
									<DropdownMenuItem
										closeOnClick={false}
										disabled={isCreatingTopic || isSubmitting}
										onClick={() => {
											setIsSubmitting(true)
											onCreateSubtopic().finally(() => {
												setIsSubmitting(false)
												setIsActionsMenuOpen(false)
											})
										}}
									>
										{isSubmitting ? (
											<>
												<Loader className='animate-spin' />
												Creating...
											</>
										) : (
											<>
												<Plus />
												New topic
											</>
										)}
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={onOpenDeleteDialog}
										variant='destructive'
									>
										<Trash2 />
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
						<Button
							aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${sectionLabel}`}
							className={cn(
								'shrink-0 rounded-full',
								isCollapsed &&
									'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
							)}
							onClick={() => toggleSection(sectionId)}
							size={buttonSize}
							type='button'
							variant='ghost'
						>
							<ChevronDown
								className={cn(
									'translate-y-px transition-transform',
									isCollapsed && '-rotate-90'
								)}
							/>
						</Button>
					</div>
				</div>
			</div>
			<div aria-hidden='true' />
			<div className={cn('min-w-0', contentTopSpacingClassName)}>
				{isCollapsed ? null : (
					<>
						<div>{bodyPanel}</div>
						<div>{reviewCardsSection}</div>
					</>
				)}
			</div>
		</div>
	)
}
