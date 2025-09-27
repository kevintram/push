import { Calendar } from '~/components/ui/Calendar'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/Popover'

interface DatePickerDropdownProps {
	selectedDate: Date
	onDateChange: (date: Date) => void
	isOpen: boolean
	onOpenChange: (open: boolean) => void
	trigger: React.ReactNode
	align?: 'start' | 'center' | 'end'
	side?: 'top' | 'right' | 'bottom' | 'left'
	sideOffset?: number
}

export function DatePickerDropdown({
	selectedDate,
	onDateChange,
	isOpen,
	onOpenChange,
	trigger,
	align = 'end',
	side = 'bottom',
	sideOffset = 0
}: DatePickerDropdownProps) {
	const handleDateSelect = (date: Date | undefined) => {
		if (date) {
			onDateChange(date)
		}
	}

	const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.value) {
			const newDate = new Date(e.target.value)
			onDateChange(newDate)
		}
	}

	return (
		<Popover onOpenChange={onOpenChange} open={isOpen}>
			<PopoverTrigger asChild={true}>{trigger}</PopoverTrigger>
			<PopoverContent
				align={align}
				className='w-auto p-4'
				side={side}
				sideOffset={sideOffset}
			>
				<div className='space-y-4'>
					<Calendar
						mode='single'
						onSelect={handleDateSelect}
						selected={selectedDate}
					/>
					<div className='flex items-center gap-2'>
						<input
							className='flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
							onChange={handleDateInputChange}
							type='date'
							value={selectedDate?.toISOString().split('T')[0]}
						/>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	)
}
