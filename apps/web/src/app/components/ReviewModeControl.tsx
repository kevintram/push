import { Button } from '~/components/ui/button'
import { ButtonGroup } from '~/components/ui/button-group'
import {
	type ReviewMode,
	useFlashcardMode
} from '~/stores/FlashcardModeContext'

const CONTROLS: Array<{ label: string; mode: ReviewMode }> = [
	{ label: 'Off', mode: 'off' },
	{ label: 'Answers', mode: 'hide_answers_only' },
	{ label: 'All', mode: 'hide_everything' }
]

export function ReviewModeControl() {
	const { reviewMode, setReviewMode } = useFlashcardMode()

	return (
		<div className='pointer-events-auto rounded-2xl border bg-background/90 p-1.5 shadow-lg backdrop-blur-sm'>
			<div className='px-2 pb-1 font-medium text-[11px] text-muted-foreground'>
				Review Mode
			</div>
			<ButtonGroup className='overflow-hidden rounded-full'>
				{CONTROLS.map(control => (
					<Button
						aria-label={`Review mode ${control.label}`}
						key={control.mode}
						onClick={() => setReviewMode(control.mode)}
						size='sm'
						variant={reviewMode === control.mode ? 'default' : 'outline'}
					>
						{control.label}
					</Button>
				))}
			</ButtonGroup>
		</div>
	)
}
