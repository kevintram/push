import { Plus, SquareStack, X } from 'lucide-react'
import { Button } from '~/components/ui/Button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/Popover'
import { Skeleton } from '~/components/ui/Skeleton'
import { useCreateReviewSession } from '../api/createReviewSession'
import { useRecentSessions } from '../api/getRecentSessions'

interface SessionPickerPopoverProps {
	selectedSessionId: number | null
	onSessionChange: (sessionId: number | null) => void
	isOpen: boolean
	onOpenChange: (open: boolean) => void
	trigger: React.ReactNode
	align?: 'start' | 'center' | 'end'
	side?: 'top' | 'right' | 'bottom' | 'left'
}

export function SessionPickerPopover({
	selectedSessionId,
	onSessionChange,
	isOpen,
	onOpenChange,
	trigger,
	align = 'start',
	side = 'bottom'
}: SessionPickerPopoverProps) {
	const { data: sessions, isLoading } = useRecentSessions()
	const { createReviewSession, isPending } = useCreateReviewSession()

	const handleCreateSession = async () => {
		const newSession = await createReviewSession({ description: '' })
		onSessionChange(newSession.id)
		onOpenChange(false)
	}

	const handleSelectSession = (sessionId: number) => {
		onSessionChange(sessionId)
		onOpenChange(false)
	}

	const handleClearSession = () => {
		onSessionChange(null)
		onOpenChange(false)
	}

	return (
		<Popover onOpenChange={onOpenChange} open={isOpen}>
			<PopoverTrigger asChild={true}>{trigger}</PopoverTrigger>
			<PopoverContent
				align={align}
				className='w-64 p-2'
				onClick={e => e.stopPropagation()}
				side={side}
			>
				{/* Create New Session Button */}
				<Button
					className='mb-2 w-full justify-start'
					disabled={isPending}
					onClick={handleCreateSession}
					size='sm'
					variant='ghost'
				>
					<Plus className='mr-2 h-4 w-4' />
					Create new session
				</Button>

				<div className='my-2 border-t' />

				{/* Recent Sessions List */}
				{isLoading ? (
					<div className='space-y-2'>
						<Skeleton className='h-8 w-full' />
						<Skeleton className='h-8 w-full' />
						<Skeleton className='h-8 w-full' />
					</div>
				) : (
					<div className='max-h-48 space-y-1 overflow-y-auto'>
						{sessions?.length === 0 ? (
							<p className='px-2 py-1 text-muted-foreground text-sm'>
								No recent sessions
							</p>
						) : (
							sessions?.map(session => (
								<Button
									className='w-full justify-start text-left'
									key={session.id}
									onClick={() => handleSelectSession(session.id)}
									size='sm'
									variant={
										selectedSessionId === session.id ? 'secondary' : 'ghost'
									}
								>
									<SquareStack className='mr-2 h-4 w-4 flex-shrink-0' />
									<span className='truncate'>
										{session.description || `Session ${session.id}`}
									</span>
								</Button>
							))
						)}
					</div>
				)}

				{/* Clear Session Option */}
				{selectedSessionId && (
					<>
						<div className='my-2 border-t' />
						<Button
							className='w-full justify-start text-muted-foreground'
							onClick={handleClearSession}
							size='sm'
							variant='ghost'
						>
							<X className='mr-2 h-4 w-4' />
							Remove from session
						</Button>
					</>
				)}
			</PopoverContent>
		</Popover>
	)
}
