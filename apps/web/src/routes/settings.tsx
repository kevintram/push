import { createFileRoute } from '@tanstack/react-router'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { useTheme } from '~/stores/ThemeContext'

const THEME_OPTIONS = [
	{ value: 'light', label: 'Light', icon: Sun },
	{ value: 'dark', label: 'Dark', icon: Moon },
	{ value: 'system', label: 'System', icon: Monitor }
] as const

export const Route = createFileRoute('/settings')({
	component: RouteComponent
})

function RouteComponent() {
	const { theme, setTheme } = useTheme()

	const currentTheme =
		THEME_OPTIONS.find(option => option.value === theme) || THEME_OPTIONS[0]

	return (
		<div className='space-y-6'>
			<div>
				<h3 className='font-medium text-lg'>Settings</h3>
			</div>
			<div className='space-y-4'>
				<div className='flex items-center justify-between'>
					<div className='space-y-0.5'>
						<div className='font-medium text-base'>Theme</div>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild={true}>
							<Button variant='outline'>
								<currentTheme.icon className='mr-2 h-4 w-4' />
								{currentTheme.label}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							{THEME_OPTIONS.map(option => (
								<DropdownMenuItem
									key={option.value}
									onClick={() => setTheme(option.value)}
								>
									<option.icon className='mr-2 h-4 w-4' />
									<span>{option.label}</span>
									{theme === option.value && (
										<Check className='ml-auto h-4 w-4' />
									)}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</div>
	)
}
