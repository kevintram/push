import { LogOut, Monitor, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/Button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/components/ui/Dialog'
import { useTheme } from '~/stores/ThemeContext'
import { apiFetch } from '~/utils/apiFetch'

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
	const [isLoggingOut, setIsLoggingOut] = useState(false)

	const handleLogout = async () => {
		setIsLoggingOut(true)
		try {
			await apiFetch(`${import.meta.env.VITE_API_URL}/logout`, {
				method: 'GET'
			})
		} catch {
			// Error handling is done by apiFetch redirect behavior
		} finally {
			setIsLoggingOut(false)
		}
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className='max-w-lg'>
				<DialogHeader>
					<DialogTitle>Settings</DialogTitle>
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
						<div className='font-medium text-sm'>Log out</div>
						<Button
							disabled={isLoggingOut}
							onClick={handleLogout}
							variant='outline'
						>
							<LogOut className='mr-2 h-4 w-4' />
							Log out
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
