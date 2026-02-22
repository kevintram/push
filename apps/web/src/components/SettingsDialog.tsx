import {
	Check,
	ChevronDown,
	LogOut,
	Monitor,
	Moon,
	Settings,
	Sun
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { Switch } from '~/components/ui/switch'
import { useFlashcardMode } from '~/stores/FlashcardModeContext'
import { useTheme } from '~/stores/ThemeContext'
import { useWeekStart, WEEK_START_OPTIONS } from '~/stores/WeekStartContext'

const THEME_OPTIONS = [
	{ value: 'light', label: 'Light', icon: Sun },
	{ value: 'dark', label: 'Dark', icon: Moon },
	{ value: 'system', label: 'System', icon: Monitor }
] as const

interface SettingsDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
	const { theme, setTheme } = useTheme()
	const {
		showReviewModeWarning,
		setShowReviewModeWarning,
		autoEnableReviewMode,
		setAutoEnableReviewMode
	} = useFlashcardMode()
	const { weekStartDay, setWeekStartDay } = useWeekStart()
	const selectedWeekStartOption = WEEK_START_OPTIONS.find(
		option => option.value === weekStartDay
	) ?? { value: 0, label: 'Sunday' }

	const handleLogout = () => {
		window.location.href = `${import.meta.env.VITE_API_URL}/logout`
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className='max-w-lg'>
				<DialogHeader>
					<DialogTitle className='flex flex-row items-center gap-2 text-base'>
						<Settings className='h-5 w-5' />
						<span>Settings</span>
					</DialogTitle>
				</DialogHeader>
				<div className='space-y-6'>
					<div className='flex items-start justify-between border-t pt-6'>
						<div className='font-medium text-sm'>Theme</div>
						<div className='flex gap-3'>
							{THEME_OPTIONS.map(option => {
								const Icon = option.icon
								const isSelected = theme === option.value
								return (
									<Button
										className='flex h-auto w-20 flex-col gap-2 px-4 py-3'
										key={option.value}
										onClick={() => setTheme(option.value)}
										variant={isSelected ? 'default' : 'outline'}
									>
										<Icon className='h-4 w-4' />
										<span>{option.label}</span>
									</Button>
								)
							})}
						</div>
					</div>

					<div className='flex items-start justify-between border-t pt-6'>
						<div>
							<div className='font-medium text-sm'>Start week on</div>
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button
										className='min-w-28 justify-between'
										variant='outline'
									/>
								}
							>
								<span>{selectedWeekStartOption.label}</span>
								<ChevronDown className='h-4 w-4' />
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end' matchTriggerWidth={false}>
								{WEEK_START_OPTIONS.map(option => {
									const isSelected = weekStartDay === option.value

									return (
										<DropdownMenuItem
											key={option.value}
											onClick={() => setWeekStartDay(option.value)}
										>
											<span className='flex-1'>{option.label}</span>
											{isSelected && <Check className='h-4 w-4' />}
										</DropdownMenuItem>
									)
								})}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div className='border-t pt-4'>
						<div className='mb-4'>
							<div className='font-medium text-base'>Review Mode</div>
						</div>
						<div className='space-y-4'>
							<div className='flex items-start justify-between gap-4'>
								<div>
									<div className='font-medium text-sm'>Show warning</div>
									<div className='text-muted-foreground text-xs'>
										Show warning when Review Mode is off in the Review Page
									</div>
								</div>
								<Switch
									checked={showReviewModeWarning}
									className='mt-0.5 shrink-0'
									onCheckedChange={setShowReviewModeWarning}
								/>
							</div>

							<div className='flex items-start justify-between gap-4 border-t pt-4'>
								<div>
									<div className='font-medium text-sm'>Auto-turn-on</div>
									<div className='text-muted-foreground text-xs'>
										Automatically turn on Review Mode in the Review Page
									</div>
								</div>
								<Switch
									checked={autoEnableReviewMode}
									className='mt-0.5 shrink-0'
									onCheckedChange={setAutoEnableReviewMode}
								/>
							</div>
						</div>
					</div>

					<div className='flex items-start justify-between border-t pt-6'>
						<div className='font-medium text-sm'>Log out</div>
						<Button onClick={handleLogout} variant='outline'>
							<LogOut className='mr-2 h-4 w-4' />
							Log out
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
