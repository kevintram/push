import { Kbd } from '~/components/ui/kbd'

export function ReviewModeTooltip({ isEnabled }: { isEnabled: boolean }) {
	return (
		<div className='flex flex-col gap-0.5'>
			<div className='flex items-center gap-2'>
				<span className='font-medium'>
					Review mode {isEnabled ? 'on' : 'off'}
				</span>
				<Kbd className=''>R</Kbd>
			</div>
			<span className='text-background/70'>
				{isEnabled
					? 'Answers are hidden until you reveal them'
					: 'Hide answers and test your recall'}
			</span>
		</div>
	)
}
