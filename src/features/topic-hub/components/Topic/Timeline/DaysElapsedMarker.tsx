export function DaysElapsedMarker({ daysElapsed }: { daysElapsed: number }) {
	return (
		<div className='flex flex-col items-center gap-2'>
			<div className='mt-2 min-h-12 w-px flex-1 bg-border' />
			<div className='font-medium text-muted-foreground text-xs'>
				{daysElapsed}d
			</div>
		</div>
	)
}