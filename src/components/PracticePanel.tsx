import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/Button'
import { Card, CardContent } from './ui/Card'
import { Input } from './ui/Input'

function PracticePanel(props: { practiceElements: Array<string> }) {
	const [questionsSearchValue, setQuestionsSearchValue] = useState('')

	return (
		<Card className='flex-1'>
			<CardContent className='flex h-full flex-col gap-4'>
				<div className='flex w-full items-center gap-2'>
					<div className='relative flex-1'>
						<Search className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
						<Input
							className='pl-9'
							onChange={e => setQuestionsSearchValue(e.target.value)}
							placeholder='Search'
							value={questionsSearchValue}
						/>
					</div>
					<Button size='icon' variant='secondary'>
						<Plus className='h-4 w-4' />
					</Button>
				</div>

				<div className='flex flex-col gap-2 overflow-auto'>
					{props.practiceElements.map(question => (
						<div
							className='w-full rounded-md bg-muted/50 p-4'
							key={question}
						>
							<span className='text-sm'>{question}</span>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}

export { PracticePanel }
