import { motion } from 'framer-motion'
import { ChevronUp, X } from 'lucide-react'
import { Button } from '~/components/ui/Button'

interface FloatingTopicCardProps {
	displayName: string
	onMaximize: () => void
	onClose: () => void
}

export function FloatingTopicCard({
	displayName,
	onMaximize,
	onClose
}: FloatingTopicCardProps) {
	return (
		<motion.button
			aria-label='Restore topic detail'
			className='fixed right-4 bottom-4 z-50 flex cursor-pointer items-center gap-2 overflow-hidden rounded-lg border bg-background p-3 hover:bg-muted'
			layoutId='topic-container'
			onClick={onMaximize}
			onKeyDown={e => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault()
					onMaximize()
				}
			}}
			tabIndex={0}
		>
			<div className='flex items-center gap-2'>
				<ChevronUp className='h-4 w-4 text-muted-foreground' />
				<span className='flex-1'>{displayName}</span>
				<Button
					className='h-5 w-5 p-0 text-muted-foreground'
					onClick={e => {
						e.stopPropagation()
						onClose()
					}}
					size='sm'
					title='Close'
					variant='ghost'
				>
					<X className='h-3 w-3' />
				</Button>
			</div>
		</motion.button>
	)
}
