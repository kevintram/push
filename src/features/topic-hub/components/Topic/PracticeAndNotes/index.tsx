import { useInsertMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { BookOpen, Columns, Plus, Target } from 'lucide-react'
import { use, useCallback, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Card, CardContent, CardHeader } from '~/components/ui/Card'
import {
	SegmentedControl,
	SegmentedControlItem
} from '~/components/ui/SegmentedControl'
import { Separator } from '~/components/ui/Separator'
import { supabase } from '~/utils/supabase'
import { TopicHubContext } from '../../../stores/SelectedTopicContext'
import { Notes } from './Notes'
import { PracticeCards } from './PracticeCards'

export function PracticeAndNotes() {
	const [tab, setTab] = useState<'notes' | 'practice'>('practice')
	const [isSplitView, setIsSplitView] = useState(false)

	const { selectedTopic } = use(TopicHubContext)

	const { mutateAsync: insertPracticeCard } = useInsertMutation(
		supabase.from('practice_cards'),
		['id'],
		'*'
	)

	const handleAddCard = useCallback(async () => {
		if (selectedTopic?.id) {
			await insertPracticeCard([
				{
					topic_id: selectedTopic.id,
					content: ''
				}
			])
		}
	}, [insertPracticeCard, selectedTopic?.id])

	// Show add button when practice cards are visible
	const showAddButton = isSplitView || tab === 'practice'

	return (
		<Card className='w-full flex-1'>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<SegmentedControl
							allActive={isSplitView}
							onValueChange={value => setTab(value as 'notes' | 'practice')}
							value={tab}
						>
							<SegmentedControlItem value='practice'>
								<Target className='mr-2 h-4 w-4' />
								Practice
							</SegmentedControlItem>
							<SegmentedControlItem value='notes'>
								<BookOpen className='mr-2 h-4 w-4' />
								Notes
							</SegmentedControlItem>
						</SegmentedControl>
						<Button
							className={isSplitView ? 'bg-primary/10' : ''}
							onClick={() => setIsSplitView(!isSplitView)}
							size='icon'
							variant='ghost'
						>
							<Columns className='h-4 w-4' />
						</Button>
					</div>
					{showAddButton && (
						<Button onClick={handleAddCard} size='icon' variant='ghost'>
							<Plus className='h-4 w-4' />
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent
				className={isSplitView ? 'flex min-h-0 flex-1 gap-4' : 'min-h-0 flex-1'}
			>
				{isSplitView ? (
					<>
						<div className='min-w-0 flex-1'>
							<PracticeCards />
						</div>
						<Separator orientation='vertical' />
						<div className='min-w-0 flex-1'>
							<Notes />
						</div>
					</>
				) : (
					<>
						{tab === 'notes' && <Notes />}
						{tab === 'practice' && <PracticeCards />}
					</>
				)}
			</CardContent>
		</Card>
	)
}
