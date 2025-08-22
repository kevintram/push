import { BookOpen, Columns, Target } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Card, CardContent, CardHeader } from '~/components/ui/Card'
import { Separator } from '~/components/ui/Separator'
import { Notes } from './Notes'
import { PracticeCards } from './PracticeCards'

export function PracticeAndNotes() {
	const [tab, setTab] = useState<'notes' | 'practice'>('practice')
	const [isSplitView, setIsSplitView] = useState(false)

	if (isSplitView) {
		return (
			<Card className='w-full flex-1'>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<div className='rounded bg-primary/10 p-1.5'>
								<BookOpen className='h-4 w-4 text-primary' />
							</div>
							<span className='font-medium'>Practice & Notes</span>
						</div>
						<Button
							className='bg-primary/10'
							onClick={() => setIsSplitView(false)}
							size='icon'
							variant='ghost'
						>
							<Columns className='h-4 w-4' />
						</Button>
					</div>
				</CardHeader>
				<CardContent className='flex min-h-0 flex-1 gap-4'>
					<div className='min-w-0 flex-1'>
						<PracticeCards />
					</div>
					<Separator orientation='vertical' />
					<div className='min-w-0 flex-1'>
						<Notes />
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className='w-full flex-1'>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<div className='flex gap-2'>
						<Button
							onClick={() => setTab('practice')}
							size='sm'
							variant={tab === 'practice' ? 'default' : 'ghost'}
						>
							<Target className='mr-2 h-4 w-4' />
							Practice
						</Button>
						<Button
							onClick={() => setTab('notes')}
							size='sm'
							variant={tab === 'notes' ? 'default' : 'ghost'}
						>
							<BookOpen className='mr-2 h-4 w-4' />
							Notes
						</Button>
					</div>
					<Button
						onClick={() => setIsSplitView(true)}
						size='icon'
						variant='ghost'
					>
						<Columns className='h-4 w-4' />
					</Button>
				</div>
			</CardHeader>
			<CardContent className='min-h-0 flex-1'>
				{tab === 'notes' && <Notes />}
				{tab === 'practice' && <PracticeCards />}
			</CardContent>
		</Card>
	)
}
