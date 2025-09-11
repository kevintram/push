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
				<div className='flex flex-row gap-3'>
					<div className='flex flex-col items-start'>
						<div className='flex items-center gap-2'>
							{/* invisible div the size of checkbox so today marker lines up with other date badges */}
							<div className='h-4 w-4' />{' '}
							<Badge className='bg-blue-600 text-white' variant='default'>
								Today
							</Badge>
						</div>

						<div className='ml-10'>
							{nextDate && (
								<DaysElapsedMarker
									daysElapsed={numDaysElapsed(today, nextDate)}
								/>
							)}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
