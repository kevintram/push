import { isValidElement } from 'react'

import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '~/components/ui/popover'

interface DatePickerDropdownProps {
	selectedDate: Date | null
	onDateChange: (date: Date | null) => void
	onInteraction?: () => void
	isOpen: boolean
	onOpenChange: (open: boolean) => void
	trigger: React.ReactNode
	align?: 'start' | 'center' | 'end'
	side?: 'top' | 'right' | 'bottom' | 'left'
	sideOffset?: number
	disabled?: boolean
}

export function DatePickerDropdown({
	selectedDate,
	onDateChange,
	onInteraction,
	isOpen,
	onOpenChange,
	trigger,
	align = 'end',
	side = 'bottom',
	sideOffset = 0,
	disabled = false,
}: DatePickerDropdownProps) {
	const triggerElement = isValidElement(trigger) ? (
		trigger
	) : (
		<span>{trigger}</span>
	)

	const handleDateSelect = (date: Date | undefined) => {
		if (date) {
			onInteraction?.()
			onDateChange(date)
		}
	}

	const setToday = () => {
		onInteraction?.()
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		onDateChange(today)
	}

	const setTomorrow = () => {
		onInteraction?.()
		const tomorrow = new Date()
		tomorrow.setDate(tomorrow.getDate() + 1)
		tomorrow.setHours(0, 0, 0, 0)
		onDateChange(tomorrow)
	}

	const clearDate = () => {
		onInteraction?.()
		onDateChange(null)
	}

	return (
		<Popover
			onOpenChange={disabled ? undefined : onOpenChange}
			open={disabled ? false : isOpen}
		>
			<PopoverTrigger disabled={disabled} render={triggerElement} />
			<PopoverContent
				align={align}
				className='w-auto p-4'
				onClick={e => e.stopPropagation()}
				onMouseDownCapture={onInteraction}
				side={side}
				sideOffset={sideOffset}
			>
				<div className='space-y-4'>
					{/* Quick Action Buttons */}
					<div className='flex gap-2'>
						<Button
							className='flex-1'
							onClick={setToday}
							size='sm'
							variant='outline'
						>
							Today
						</Button>
						<Button
							className='flex-1'
							onClick={setTomorrow}
							size='sm'
							variant='outline'
						>
							Tomorrow
						</Button>
					</div>

					{/* Calendar */}
					<Calendar
						mode='single'
						onSelect={handleDateSelect}
						selected={selectedDate || undefined}
					/>

					{/* Clear Date Button */}
					<Button
						className='w-full'
						onClick={clearDate}
						size='sm'
						variant='outline'
					>
						Clear
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	)
}
