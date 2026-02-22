import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group'
import {
	type ReviewMode,
	useFlashcardMode
} from '~/stores/FlashcardModeContext'

const CONTROLS: Array<{ label: string; mode: ReviewMode }> = [
	{ label: 'Off', mode: 'off' },
	{ label: 'On', mode: 'on' }
]

export function ReviewModeControl() {
	const { reviewMode, setReviewMode } = useFlashcardMode()

	return (
		<div className='pointer-events-auto flex max-w-42 flex-col gap-2 rounded-2xl border bg-background/90 p-3 shadow-lg backdrop-blur-sm'>
			<div>
				<span className='font-medium text-sm'>Review Mode</span>
				<p className='text-muted-foreground text-xs'>
					Hide stuff so you can guess stuff
				</p>
			</div>
			<div className='flex justify-center'>
				<ToggleGroup
					onValueChange={value => {
						if (value.length > 0) {
							setReviewMode(value.at(-1) as ReviewMode)
						}
					}}
					size='sm'
					value={[reviewMode]}
					variant='outline'
				>
					{CONTROLS.map(control => (
						<ToggleGroupItem
							aria-label={`Review mode ${control.label}`}
							key={control.mode}
							value={control.mode}
						>
							{control.label}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			</div>
		</div>
	)
}
