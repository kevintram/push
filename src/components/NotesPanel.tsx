import { Card, CardContent } from './ui/Card'

function NotesPanel(props: { content: string }) {
	return (
		<Card className='w-80 flex-none'>
			<CardContent className='h-full'>
				<div className='flex h-full flex-col'>
					<span className='text-sm leading-relaxed'>{props.content}</span>
				</div>
			</CardContent>
		</Card>
	)
}

export { NotesPanel }
