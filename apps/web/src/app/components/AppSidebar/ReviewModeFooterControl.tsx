import { BookOpen } from 'lucide-react'
import { BookOpenOff } from '~/components/icons'
import {
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar
} from '~/components/ui/sidebar'
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group'
import {
	type ReviewMode,
	useFlashcardMode
} from '~/stores/FlashcardModeContext'

const CONTROLS: Array<{ label: string; mode: ReviewMode }> = [
	{ label: 'Off', mode: 'off' },
	{ label: 'On', mode: 'on' }
]

function getReviewModeStatusLabel(reviewMode: ReviewMode) {
	return reviewMode === 'on' ? 'On' : 'Off'
}

export function ReviewModeFooterControl() {
	const { reviewMode, setReviewMode } = useFlashcardMode()
	const { state } = useSidebar()
	const statusLabel = getReviewModeStatusLabel(reviewMode)
	const isOn = reviewMode === 'on'
	const ReviewModeIcon = isOn ? BookOpen : BookOpenOff

	if (state === 'collapsed') {
		return (
			<SidebarMenuItem>
				<SidebarMenuButton
					aria-label={`Review Mode: ${statusLabel}`}
					aria-pressed={isOn}
					className='data-active:bg-background/80 dark:data-active:bg-background/80 data-active:[&_svg]:text-blue-600 dark:data-active:[&_svg]:text-blue-400'
					isActive={isOn}
					onClick={() => setReviewMode(reviewMode === 'on' ? 'off' : 'on')}
					tooltip={`Review Mode ${statusLabel}`}
				>
					<ReviewModeIcon />
					<span className='sr-only'>{`Review Mode: ${statusLabel}`}</span>
				</SidebarMenuButton>
			</SidebarMenuItem>
		)
	}

	return (
		<SidebarMenuItem>
			<div className='rounded-xl border border-sidebar-border/70 bg-background/80 p-3 shadow-xs'>
				<div className='mb-3 flex items-start gap-2'>
					<div
						className={
							isOn
								? 'mt-0.5 text-blue-600 dark:text-blue-400'
								: 'mt-0.5 text-sidebar-foreground'
						}
					>
						<ReviewModeIcon className='h-4 w-4' />
					</div>
					<div className='min-w-0 flex-1'>
						<div className='font-medium text-sm'>Review Mode</div>
						<p className='mt-1 text-muted-foreground text-xs'>
							Hide stuff so you can guess stuff
						</p>
					</div>
				</div>
				<ToggleGroup
					className='w-full'
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
							className='flex-1 justify-center'
							key={control.mode}
							value={control.mode}
						>
							{control.label}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			</div>
		</SidebarMenuItem>
	)
}
