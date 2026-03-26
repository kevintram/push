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
import type { TopicDocumentSectionNode } from './topicDocumentUtils'

interface TopicDocumentNestedSectionProps {
	bodyPanel: ReactNode
	createdDate: string
	createdText: string
	flushTitle: () => void
	headingClassName: string
	HeadingIcon: ComponentType<{ className?: string }>
	isCollapsed: boolean
	isCreatingTopic: boolean
	onCreateSubtopic: () => void
	onOpenDeleteDialog: () => void
	onOpenTopic: () => void
	onTitleChange: ChangeEventHandler<HTMLTextAreaElement>
	reviewCardsSection: ReactNode
	section: TopicDocumentSectionNode
	sectionId: string
	sectionLabel: string
	title: string
	toggleSection: (sectionId: string) => void
	updatedDate: string
	updatedText: string
}

export function TopicDocumentNestedSection({
	bodyPanel,
	createdDate,
	createdText,
	flushTitle,
	headingClassName,
	HeadingIcon,
	isCollapsed,
	isCreatingTopic,
	onCreateSubtopic,
	onOpenDeleteDialog,
	onOpenTopic,
	onTitleChange,
	reviewCardsSection,
	section,
	sectionId,
	sectionLabel,
	title,
	toggleSection,
	updatedDate,
	updatedText
}: TopicDocumentNestedSectionProps) {
	return (
		<div className='group/section grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-1.5'>
			<div className='relative text-muted-foreground/60'>
				<div className='absolute top-0 right-0 flex items-start justify-end gap-0.5'>
					<Button
						aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${sectionLabel}`}
						className='pointer-events-none h-7 w-7 shrink-0 opacity-0 transition-opacity focus-visible:pointer-events-auto focus-visible:opacity-100 group-hover/section:pointer-events-auto group-hover/section:opacity-100'
						onClick={() => toggleSection(sectionId)}
						size='icon-xs'
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
					<div className='flex h-7 w-7 shrink-0 items-center justify-center'>
						<HeadingIcon className='h-5 w-5' />
					</div>
				</div>
			</div>
			<div className='relative min-w-0'>
				<div
					aria-level={section.headingLevel}
					className='min-w-0'
					role='heading'
				>
					<textarea
						aria-label={`Topic title ${section.topic.id}`}
						className={`field-sizing-content m-0 block min-h-0 w-full resize-none overflow-hidden border-none bg-transparent p-0 pr-8 leading-tight outline-none placeholder:text-muted-foreground ${headingClassName}`}
						onBlur={flushTitle}
						onChange={onTitleChange}
						placeholder='Untitled topic'
						spellCheck={false}
						value={title}
					/>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button
								aria-label={`More actions for ${sectionLabel}`}
								className='absolute top-0 right-0 h-8 w-8 shrink-0 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/section:opacity-100 data-[state=open]:opacity-100'
								size='icon-sm'
								variant='ghost'
							>
								<MoreHorizontal className='h-4 w-4' />
							</Button>
						}
					/>
					<DropdownMenuContent align='end'>
						<DropdownMenuItem onClick={onOpenTopic}>
							<ExternalLink className='h-4 w-4' />
							Open topic
						</DropdownMenuItem>
						<DropdownMenuItem
							disabled={isCreatingTopic}
							onClick={() => {
								onCreateSubtopic()
							}}
						>
							<Plus className='h-4 w-4' />
							New subtopic
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={onOpenDeleteDialog}
							variant='destructive'
						>
							<Trash2 className='h-4 w-4' />
							Delete topic
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div aria-hidden='true' />
			<div className='min-w-0 space-y-2'>
				{isCollapsed ? null : (
					<>
						<div className='flex flex-wrap items-center gap-2 text-[0.8125rem] text-muted-foreground/70'>
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
						{bodyPanel}
						{reviewCardsSection}
					</>
				)}
			</div>
		</div>
	)
}
