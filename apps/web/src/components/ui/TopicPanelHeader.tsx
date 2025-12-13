import type { ReactNode } from 'react'

interface TopicPanelHeaderProps {
	label: ReactNode
	actions?: ReactNode
}

export function TopicPanelHeader({ label, actions }: TopicPanelHeaderProps) {
	return (
		<div className='flex items-center gap-2 border-b-1 pb-1'>
			{label}
			<div className='flex-1' />
			{actions}
		</div>
	)
}
