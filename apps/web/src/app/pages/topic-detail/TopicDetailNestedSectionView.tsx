import {
	ChevronDown,
	ExternalLink,
	type LucideIcon,
	MoreHorizontal,
	Plus,
	Trash2
} from 'lucide-react'
import type { ChangeEventHandler, ReactNode } from 'react'
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
import { TopicDetailSectionMeta } from './TopicDetailSectionMeta'
import { TOPIC_DETAIL_SECTION_GRID_CLASS } from './topicDetailLayout'
import type { TopicDetailSectionNode } from './topicDetailStructure'

interface TopicDetailNestedSectionViewProps {
	bodyPanel: ReactNode
	createdDate: string
	createdText: string
	flushTitle: () => void
	headingClassName: string
	headingIconClassName: string
	headingIndicatorFrameClassName: string
	HeadingIcon: LucideIcon
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
	flushTitle,
	headingClassName,
	headingIconClassName,
	headingIndicatorFrameClassName,
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
	return (
		<div className={cn('group/section', TOPIC_DETAIL_SECTION_GRID_CLASS)}>
			<div className='relative text-muted-foreground/60'>
				<div className='absolute right-0 flex items-start justify-end gap-0.5'>
					<div
						className={cn(
							'flex shrink-0 items-center justify-center',
							headingIndicatorFrameClassName
						)}
					>
						<HeadingIcon className={headingIconClassName} strokeWidth={2.6} />
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
											className='h-8 w-8 shrink-0 rounded-full'
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
											className='h-8 w-8 shrink-0 rounded-full'
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
								'h-8 w-8 shrink-0 rounded-full',
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
						<TopicDetailSectionMeta
							createdDate={createdDate}
							createdText={createdText}
							updatedDate={updatedDate}
							updatedText={updatedText}
						/>
						<div className='pt-3'>{bodyPanel}</div>
						<div>{reviewCardsSection}</div>
					</>
				)}
			</div>
		</div>
	)
}
