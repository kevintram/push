import { useNavigate, useParams } from '@tanstack/react-router'
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
	const params = useParams({ strict: false })

	// Check if the background page topic (from URL) is a parent or child of the dialog topic
	const relatedTopicId = useMemo(() => {
		const backgroundTopicId = params.topicId
			? Number.parseInt(params.topicId, 10)
			: undefined

		if (!(backgroundTopicId && topic)) return

		const isParent = topic.parents?.some(p => p.id === backgroundTopicId)
		const isChild = topic.children?.some(c => c.id === backgroundTopicId)

		return isParent || isChild ? backgroundTopicId : undefined
	}, [params.topicId, topic])

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

	if (!selectedTopicId) {
		return null
	}

	return (
		<Dialog onOpenChange={closeTopicDialog} open={isOpen}>
			<DialogContent
				className='h-full w-full p-0 md:max-h-[600px] md:max-w-[800px] lg:max-w-[900px] xl:max-w-[1100px] 2xl:max-w-[1200px]'
				showCloseButton={false}
			>
				<TopicContext value={contextValue}>
					<TopicDetail
						headerActions={headerActions}
						onDelete={handleDelete}
						relatedTopicId={relatedTopicId}
					/>
				</TopicContext>
			</DialogContent>
		</Dialog>
	)
}
