import { Badge } from '~/components/ui/Badge'
import { Card, CardContent } from '~/components/ui/Card'
import { numDaysElapsed } from '../../../utils/daysElapsed'
import { DaysElapsedMarker } from './DaysElapsedMarker'

export function TodayMarker({
	nextDate,
	today
}: {
	nextDate?: Date | undefined
	today: Date
}) {
	return (
		<Card className='rounded border-none bg-transparent px-2 py-1 shadow-none'>
			<CardContent className='p-0'>
				<div className='flex flex-row justify-end gap-3 py-1'>
					<div className='flex shrink-0 flex-col items-end gap-2 text-xs'>
						<Badge className='bg-blue-600 text-white text-xs' variant='default'>
							Today
						</Badge>
						{nextDate && (
							<div className='mr-6 flex h-full'>
								<DaysElapsedMarker
									daysElapsed={numDaysElapsed(today, nextDate)}
								/>
							</div>
						)}
					</div>
					{/* invisible index so today marker lines up with scheduled entries */}
					<div className='flex font-medium text-muted-foreground text-xs opacity-100'>
						0
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
