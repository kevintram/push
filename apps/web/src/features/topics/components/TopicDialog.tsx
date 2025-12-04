import { useNavigate } from '@tanstack/react-router'
import { Maximize2, X } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { Button } from '~/components/ui/Button'
import { Dialog, DialogContent } from '~/components/ui/Dialog'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useTopicWithRelationships } from '../hooks/useTopicWithRelationships'
import { TopicContext } from '../stores/SelectedTopicContext'
import { TopicDetail } from './TopicDetail/TopicDetail'

export function TopicDialog() {
	const { topicDialogState, closeTopicDialog, maximizeTopicDialog } =
		useReviewTopicDialog()
	const { isOpen, topicId: selectedTopicId } = topicDialogState
	const navigate = useNavigate()
	const { topic, isLoading } = useTopicWithRelationships(selectedTopicId)

	const handleDelete = useCallback(() => {
		closeTopicDialog()
	}, [closeTopicDialog])

	const handleNavigate = useCallback(() => {
		if (selectedTopicId) {
			maximizeTopicDialog()
			navigate({
				to: '/topics/{-$topicId}',
				params: { topicId: selectedTopicId.toString() }
			})
		}
	}, [selectedTopicId, navigate, maximizeTopicDialog])

	const afterMoreButton = useMemo(
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
					onClick={closeTopicDialog}
					size='sm'
					variant='ghost'
				>
					<X className='h-4 w-4' />
				</Button>
			</>
		),
		[handleNavigate, closeTopicDialog]
	)

	const contextValue = useMemo(
		() => ({
			topic,
			isLoading
		}),
		[topic, isLoading]
	)

	return (
		<Dialog onOpenChange={closeTopicDialog} open={isOpen}>
			<DialogContent
				className='h-full w-full p-0 md:max-h-[600px] md:max-w-[800px] lg:max-w-[900px] xl:max-w-[1100px] 2xl:max-w-[1200px]'
				showCloseButton={false}
			>
				<TopicContext value={contextValue}>
					<TopicDetail
						afterMoreButton={afterMoreButton}
						onDelete={handleDelete}
					/>
				</TopicContext>
			</DialogContent>
		</Dialog>
	)
}
