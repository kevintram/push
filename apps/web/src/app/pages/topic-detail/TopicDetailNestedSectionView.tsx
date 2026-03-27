import {
	ChevronDown,
	ExternalLink,
	MoreHorizontal,
	Plus,
	Trash2
} from 'lucide-react'
import type { ChangeEventHandler, ComponentType, ReactNode } from 'react'
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
import type { TopicDetailSectionNode } from './topicDetailStructure'

interface TopicDetailNestedSectionViewProps {
	bodyPanel: ReactNode
	createdDate: string
	createdText: string
	displayLevel: number
	flushTitle: () => void
	headingClassName: string
	HeadingIcon: ComponentType<{ className?: string }>
	isCollapsed: boolean
	isCreatingTopic: boolean
	onCreateSubtopic: () => void
	onOpenDeleteDialog: () => void
	onOpenTopic: () => void
	onTitleChange: ChangeEventHandler<HTMLTextAreaElement>
	registerHeadingRef: (element: HTMLDivElement | null) => void
	reviewCardsSection: ReactNode
	section: TopicDetailSectionNode
	sectionId: string
	sectionLabel: string
	title: string
	toggleSection: (sectionId: string) => void
	updatedDate: string
	updatedText: string
}

export function TopicDetailNestedSectionView({
	bodyPanel,
	createdDate,
	createdText,
	displayLevel,
	flushTitle,
	headingClassName,
	HeadingIcon,
	isCollapsed,
	isCreatingTopic,
	onCreateSubtopic,
	onOpenDeleteDialog,
	onOpenTopic,
	onTitleChange,
	registerHeadingRef,
	reviewCardsSection,
	section,
	sectionId,
	sectionLabel,
	title,
	toggleSection,
	updatedDate,
	updatedText
}: TopicDetailNestedSectionViewProps) {
	const headingIconClassName =
		displayLevel <= 2
			? 'h-[1.125rem] w-[1.125rem]'
			: displayLevel === 3
				? 'h-4 w-4'
				: displayLevel === 4
					? 'h-[0.9375rem] w-[0.9375rem]'
					: displayLevel === 5
						? 'h-[0.875rem] w-[0.875rem]'
						: 'h-[0.8125rem] w-[0.8125rem]'
	const headingIndicatorFrameClassName =
		displayLevel <= 2
			? 'top-0.5 h-7 w-7'
			: displayLevel === 3
				? 'top-0 h-6 w-6'
				: 'top-0 h-5 w-5'

	return (
		<div className='group/section grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-1.5'>
			<div className='relative text-muted-foreground/60'>
				<div className='absolute right-0 flex items-start justify-end gap-0.5'>
					<div
						className={cn(
							'flex shrink-0 items-center justify-center',
							headingIndicatorFrameClassName
						)}
					>
						<HeadingIcon className={headingIconClassName} />
					</div>
				</div>
			</div>
			<div
				className='relative min-w-0 scroll-mt-24'
				data-topic-detail-heading-id={section.topic.id}
				ref={registerHeadingRef}
			>
				<div className='relative min-w-0'>
					<div
						aria-level={section.headingLevel}
						className='min-w-0 pr-28 sm:pr-32'
						role='heading'
					>
						<textarea
							aria-label={`Topic title ${section.topic.id}`}
							className={`field-sizing-content m-0 block min-h-0 w-full resize-none overflow-hidden border-none bg-transparent p-0 leading-tight outline-none placeholder:text-muted-foreground ${headingClassName}`}
							onBlur={flushTitle}
							onChange={onTitleChange}
							placeholder='Untitled topic'
							spellCheck={false}
							value={title}
						/>
					</div>
					<div className='absolute top-0 right-0 flex items-start gap-0.5'>
						<div className='pointer-events-none flex items-start gap-0.5 opacity-0 transition-opacity group-hover/section:pointer-events-auto group-hover/section:opacity-100 group-has-[:focus-visible]/section:pointer-events-auto group-has-[:focus-visible]/section:opacity-100'>
							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											aria-label={`Open ${sectionLabel}`}
											className='h-8 w-8 shrink-0'
											onClick={onOpenTopic}
											size='icon-sm'
											type='button'
											variant='ghost'
										>
											<ExternalLink className='h-4 w-4' />
										</Button>
									}
								/>
								<TooltipContent>Open topic</TooltipContent>
							</Tooltip>
							<DropdownMenu>
								<DropdownMenuTrigger
									render={
										<Button
											aria-label={`More actions for ${sectionLabel}`}
											className='h-8 w-8 shrink-0'
											size='icon-sm'
											variant='ghost'
										>
											<MoreHorizontal className='h-4 w-4' />
										</Button>
									}
								/>
								<DropdownMenuContent align='end'>
									<DropdownMenuItem
										disabled={isCreatingTopic}
										onClick={() => {
											onCreateSubtopic()
										}}
									>
										<Plus className='h-4 w-4' />
										New topic
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={onOpenDeleteDialog}
										variant='destructive'
									>
										<Trash2 className='h-4 w-4' />
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
						<Button
							aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${sectionLabel}`}
							className={cn(
								'h-8 w-8 shrink-0',
								isCollapsed &&
									'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
							)}
							onClick={() => toggleSection(sectionId)}
							size='icon-sm'
							type='button'
							variant='ghost'
						>
							<ChevronDown
								className={cn(
									'h-4 w-4 translate-y-px transition-transform',
									isCollapsed && '-rotate-90'
								)}
							/>
						</Button>
					</div>
				</div>
			</div>
			<div aria-hidden='true' />
			<div className='min-w-0 pt-1'>
				{isCollapsed ? null : (
					<>
						<div className='flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-[0.8125rem] text-muted-foreground/75 tracking-[0.01em]'>
							<Tooltip>
								<TooltipTrigger
									render={<span>{`Edited ${updatedText}`}</span>}
								/>
								<TooltipContent>{updatedDate}</TooltipContent>
							</Tooltip>
							<span aria-hidden={true}>·</span>
							<Tooltip>
								<TooltipTrigger
									render={<span>{`Created ${createdText}`}</span>}
								/>
								<TooltipContent>{createdDate}</TooltipContent>
							</Tooltip>
						</div>
						<div className='pt-3'>{bodyPanel}</div>
						<div>{reviewCardsSection}</div>
					</>
				)}
			</div>
		</div>
	)
}
