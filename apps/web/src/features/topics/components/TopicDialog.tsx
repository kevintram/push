import { useNavigate } from '@tanstack/react-router'
import { Maximize2, X } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { Button } from '~/components/ui/Button'
import { Dialog, DialogContent } from '~/components/ui/Dialog'
import { useTopicWithRelationships } from '../hooks/useTopicWithRelationships'
import { TopicContext } from '../stores/SelectedTopicContext'
import { TopicDetail } from './TopicDetail/TopicDetail'

interface TopicDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	topicId: number | undefined
}

export function TopicDialog({ open, onOpenChange, topicId }: TopicDialogProps) {
	const navigate = useNavigate()
	const { topic, isLoading } = useTopicWithRelationships(topicId)

	const handleDelete = useCallback(() => {
		onOpenChange(false)
	}, [onOpenChange])

	const handleNavigate = useCallback(() => {
		if (topicId) {
			navigate({
				to: '/topics/{-$topicId}',
				params: { topicId: topicId.toString() }
			})
			onOpenChange(false)
		}
	}, [topicId, navigate, onOpenChange])

	const headerActions = useMemo(
		() => (
			<>
				<Button
					className='h-6 w-6 p-0 text-muted-foreground'
					onClick={handleNavigate}
					size='sm'
					variant='ghost'
				>
					<Maximize2 className='h-4 w-4' />
				</Button>

				<Button
					className='h-6 w-6 p-0 text-muted-foreground'
					onClick={() => onOpenChange(false)}
					size='sm'
					variant='ghost'
				>
					<X className='h-4 w-4' />
				</Button>
			</>
		),
		[handleNavigate, onOpenChange]
	)

	const contextValue = useMemo(
		() => ({
			topic,
			isLoading
		}),
		[topic, isLoading]
	)

	if (!topicId) {
		return null
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className='h-full w-full p-0 md:max-h-[600px] md:max-w-[800px] lg:max-w-[900px] xl:max-w-[1100px] 2xl:max-w-[1200px]'
				showCloseButton={false}
			>
				<TopicContext value={contextValue}>
					<TopicDetail headerActions={headerActions} onDelete={handleDelete} />
				</TopicContext>
			</DialogContent>
		</Dialog>
	)
}
