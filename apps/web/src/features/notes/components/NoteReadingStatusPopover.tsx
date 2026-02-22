import { Check } from 'lucide-react'
import type { ChangeEvent, ReactElement } from 'react'
import { BookOpenOff } from '~/components/icons/BookOpenOff'
import { Button } from '~/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/popover'
import { cn } from '~/lib/utils'
import { READING_STATUS_OPTIONS } from '../constants/readingStatusOptions'
import type { ReadingStatus } from '../types/note.types'

interface NoteReadingStatusPopoverProps {
	status: ReadingStatus
	disabled?: boolean
	trigger: ReactElement
	open?: boolean
	onOpenChange?: (open: boolean) => void
	onStatusChange: (status: ReadingStatus) => void
	progressNote?: string
	onProgressNoteChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void
	onRemoveFromReadingList?: () => void
	align?: 'start' | 'center' | 'end'
	side?: 'top' | 'right' | 'bottom' | 'left'
	sideOffset?: number
	contentClassName?: string
}

export function NoteReadingStatusPopover({
	status,
	disabled = false,
	trigger,
	open,
	onOpenChange,
	onStatusChange,
	progressNote,
	onProgressNoteChange,
	onRemoveFromReadingList,
	align = 'start',
	side = 'bottom',
	sideOffset = 6,
	contentClassName
}: NoteReadingStatusPopoverProps) {
	const hasProgressNote =
		progressNote !== undefined && onProgressNoteChange !== undefined

	return (
		<Popover onOpenChange={onOpenChange} open={open}>
			<PopoverTrigger disabled={disabled} render={trigger} />
			<PopoverContent
				align={align}
				className={cn(
					'w-fit max-w-none overflow-hidden rounded-xl p-2.5',
					contentClassName
				)}
				onClick={event => event.stopPropagation()}
				onKeyDown={event => event.stopPropagation()}
				onPointerDown={event => event.stopPropagation()}
				side={side}
				sideOffset={sideOffset}
			>
				<div className='space-y-2 [width:max-content]'>
					<div className='inline-flex w-full flex-col gap-1 rounded-lg border bg-muted/20 p-1'>
						{onRemoveFromReadingList ? (
							<>
								<Button
									className='h-8 w-full justify-start gap-2 rounded-md px-2 font-normal text-rose-700 text-sm hover:text-rose-700 active:text-rose-700 dark:text-rose-300 dark:active:text-rose-300 dark:hover:text-rose-300'
									disabled={disabled}
									onClick={event => {
										event.stopPropagation()
										onRemoveFromReadingList()
									}}
									size='sm'
									variant='ghost'
								>
									<BookOpenOff className='h-4 w-4' />
									<span className='flex-1 text-left'>Remove</span>
									<span className='inline-block h-4 w-4' />
								</Button>
								<div className='mx-1 h-px bg-border' />
							</>
						) : null}
						{READING_STATUS_OPTIONS.map(option => {
							const OptionIcon = option.icon
							const isSelected = status === option.value
							return (
								<Button
									className={cn(
										'h-8 w-full justify-start gap-2 rounded-md px-2 font-normal text-sm',
										isSelected && 'bg-accent/70'
									)}
									disabled={disabled}
									key={option.value}
									onClick={event => {
										event.stopPropagation()
										onStatusChange(option.value)
									}}
									size='sm'
									variant='ghost'
								>
									<OptionIcon
										className={cn('h-4 w-4', option.colorClassName)}
									/>
									<span
										className={cn('flex-1 text-left', option.colorClassName)}
									>
										{option.label}
									</span>
									{isSelected ? (
										<Check className='h-4 w-4' />
									) : (
										<span className='inline-block h-4 w-4' />
									)}
								</Button>
							)
						})}
					</div>

					{hasProgressNote && (
						<div className='space-y-1 px-1'>
							<p className='font-medium text-[11px] text-muted-foreground uppercase tracking-wide'>
								Reading notes
							</p>
							<textarea
								className='block min-h-24 w-full min-w-0 resize-y rounded-md border border-input bg-background px-2.5 py-2 text-sm leading-5 shadow-xs outline-none transition-[color,box-shadow] [field-sizing:fixed] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20'
								disabled={disabled}
								name='progress_note'
								onChange={onProgressNoteChange}
								placeholder='Page number, timestamp, etc.'
								value={progressNote}
							/>
						</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	)
}
