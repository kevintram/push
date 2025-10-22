import { useNavigate } from '@tanstack/react-router'
import { Maximize2, X } from 'lucide-react'
import { use, useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Dialog, DialogContent } from '~/components/ui/Dialog'
import { TopicContext } from '~/features/topics/stores/SelectedTopicContext'
import type { Topic } from '~/types/topics.types'
import { TopicDetail } from './TopicDetail/TopicDetail'

interface TopicDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function TopicDialog({ open, onOpenChange }: TopicDialogProps) {
	const navigate = useNavigate()
	const { topic: contextTopic } = use(TopicContext)

	// Track the current topic being viewed in the dialog
	const [currentTopicId, setCurrentTopicId] = useState<number | undefined>(
		contextTopic?.id
	)

	// Update current topic when context topic changes
	useEffect(() => {
		if (contextTopic?.id) {
			setCurrentTopicId(contextTopic.id)
		}
	}, [contextTopic?.id])

	const handleDelete = useCallback(() => {
		onOpenChange(false)
	}, [onOpenChange])

	const handleTopicChange = useCallback((topic: Topic) => {
		setCurrentTopicId(topic.id)
	}, [])

	const handleNavigate = useCallback(() => {
		if (currentTopicId) {
			navigate({
				to: '/topics/{-$topicId}',
				params: { topicId: currentTopicId.toString() }
			})
			onOpenChange(false)
		}
	}, [currentTopicId, navigate, onOpenChange])

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

	if (!contextTopic) {
		return null
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className='h-full w-full p-0 md:max-h-[600px] md:max-w-[800px] lg:max-w-[900px] xl:max-w-[1100px] 2xl:max-w-[1200px]'
				showCloseButton={false}
			>
				<TopicDetail
					headerActions={headerActions}
					onDelete={handleDelete}
					onTopicChange={handleTopicChange}
					topicId={currentTopicId}
				/>
			</DialogContent>
		</Dialog>
	)
}
