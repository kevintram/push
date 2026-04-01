import {
	ChevronDown,
	ExternalLink,
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
import {
	TopicDetailSectionBreadcrumb,
	type TopicPathItem
} from './TopicDetailBreadcrumb'
import {
	getTopicDetailSectionDisplayLevel,
	TOPIC_DETAIL_SECTION_GRID_CLASS
} from './topicDetailLayout'
import type { TopicDetailSectionNode } from './topicDetailStructure'

function getActionButtonProps(section: TopicDetailSectionNode) {
	const displayLevel = getTopicDetailSectionDisplayLevel(section)
	if (displayLevel <= 4) {
		return {
			buttonSize: 'icon-sm' as const,
			iconClassName: 'size-4'
		}
	}
	return {
		buttonSize: 'icon-xs' as const,
		iconClassName: 'size-3'
	}
}

interface TopicDetailNestedSectionViewProps {
	bodyPanel: ReactNode
	flushTitle: () => void
	headingClassName: string
	isCollapsed: boolean
	isCreatingTopic: boolean
	isFreshTopic: boolean
	onCreateSubtopic: () => void
	onOpenDeleteDialog: () => void
	onOpenTopic: () => void
	onTitleChange: ChangeEventHandler<HTMLTextAreaElement>
	registerHeadingRef: (element: HTMLDivElement | null) => void
	registerTitleRef: (element: HTMLTextAreaElement | null) => void
	reviewCardsSection: ReactNode
	rootTopicId: number
	rootTopicPath: Array<TopicPathItem>
	section: TopicDetailSectionNode
	sectionId: string
	sectionLabel: string
	title: string
	topicPath: Array<TopicPathItem>
	toggleSection: (sectionId: string) => void
}

export function TopicDetailNestedSectionView({
	bodyPanel,
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
	rootTopicId,
	rootTopicPath,
	section,
	sectionId,
	sectionLabel,
	title,
	topicPath,
	toggleSection
}: TopicDetailNestedSectionViewProps) {
	const { buttonSize, iconClassName } = getActionButtonProps(section)

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
			<div
				className='relative min-w-0 scroll-mt-24'
				data-topic-detail-heading-id={section.topic.id}
				ref={registerHeadingRef}
			>
				<div className='min-w-0'>
					{topicPath.length > 1 ? (
						<TopicDetailSectionBreadcrumb
							className='min-w-0 opacity-0 transition-opacity group-hover/section:opacity-100 group-has-[:focus-visible]/section:opacity-100'
							currentTopicId={section.topic.id}
							rootTopicId={rootTopicId}
							rootTopicPath={rootTopicPath}
							topicPath={topicPath}
						/>
					) : null}
					<div className='flex min-w-0 items-start gap-2'>
						<div
							aria-level={section.headingLevel}
							className='min-w-0 flex-1'
							role='heading'
						>
							<textarea
								aria-label={`Topic title ${section.topic.id}`}
								className={`field-sizing-content m-0 block min-h-0 w-full resize-none overflow-hidden border-none bg-transparent p-0 leading-tight outline-none placeholder:text-muted-foreground ${headingClassName}`}
								onBlur={flushTitle}
								onChange={onTitleChange}
								placeholder='Untitled topic'
								ref={registerTitleRef}
								spellCheck={false}
								value={title}
							/>
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
												<ExternalLink className={iconClassName} />
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
												className='shrink-0 rounded-full'
												size={buttonSize}
												variant='ghost'
											>
												<MoreHorizontal className={iconClassName} />
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
										iconClassName,
										'translate-y-px transition-transform',
										isCollapsed && '-rotate-90'
									)}
								/>
							</Button>
						</div>
					</div>
				</div>
			</div>
			<div className='min-w-0 pt-1'>
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
