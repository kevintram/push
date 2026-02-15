import { Check } from 'lucide-react'
import type { ChangeEvent, ReactElement } from 'react'
import { Button } from '~/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/popover'
import { cn } from '~/lib/utils'
import { SOURCE_STATUS_OPTIONS } from '../constants/statusOptions'
import type { SourceLifecycleStatus } from '../types/source.types'

interface SourceStatusPopoverProps {
	status: SourceLifecycleStatus
	disabled?: boolean
	trigger: ReactElement
	onStatusChange: (status: SourceLifecycleStatus) => void
	progressNote?: string
	onProgressNoteChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void
	align?: 'start' | 'center' | 'end'
	side?: 'top' | 'right' | 'bottom' | 'left'
	sideOffset?: number
	contentClassName?: string
}

export function SourceStatusPopover({
	status,
	disabled = false,
	trigger,
	onStatusChange,
	progressNote,
	onProgressNoteChange,
	align = 'start',
	side = 'bottom',
	sideOffset = 6,
	contentClassName
}: SourceStatusPopoverProps) {
	const hasProgressNote =
		progressNote !== undefined && onProgressNoteChange !== undefined

	return (
		<Popover>
			<PopoverTrigger disabled={disabled} render={trigger} />
			<PopoverContent
				align={align}
				className={cn(
					'w-fit max-w-none overflow-hidden rounded-xl p-2.5',
					contentClassName
				)}
				side={side}
				sideOffset={sideOffset}
			>
				<div className='space-y-2 [width:max-content]'>
					<div className='inline-flex w-full flex-col gap-1 rounded-lg border bg-muted/20 p-1'>
						{SOURCE_STATUS_OPTIONS.map(option => {
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
									onClick={() => onStatusChange(option.value)}
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
								Progress note
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
