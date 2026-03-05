import { useNavigate } from '@tanstack/react-router'
import { Library, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PageLayout } from '~/app/layouts/PageLayout'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { Input } from '~/components/ui/input'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { Textarea } from '~/components/ui/textarea'
import { useCreateTopic } from '~/features/topics/api/createTopic'
import { useTopics } from '~/features/topics/api/getTopics'
import { TopicCard } from '~/features/topics/components/TopicCard'
import {
	CREATE_TOPIC_INTENT_EVENT,
	consumeCreateTopicRequest
} from '~/features/topics/createTopicIntent'

export function MyLibraryPage() {
	const navigate = useNavigate()
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
	const [title, setTitle] = useState('')
	const [body, setBody] = useState('')

	const { data: topics = [], isLoading: topicsLoading } = useTopics({
		root: true,
		order: 'desc'
	})
	const { mutateAsync: createTopicAsync, isPending: isCreatingTopic } =
		useCreateTopic()
	const isLoading = topicsLoading

	useEffect(() => {
		const openRequestedDialog = () => {
			if (consumeCreateTopicRequest()) {
				setIsCreateDialogOpen(true)
			}
		}

		openRequestedDialog()
		window.addEventListener(CREATE_TOPIC_INTENT_EVENT, openRequestedDialog)

		return () => {
			window.removeEventListener(CREATE_TOPIC_INTENT_EVENT, openRequestedDialog)
		}
	}, [])

	async function handleCreateTopic() {
		try {
			const created = await createTopicAsync({
				title: title.trim(),
				body: body.trim(),
				parent_id: null
			})
			setIsCreateDialogOpen(false)
			setTitle('')
			setBody('')
			await navigate({
				to: '/topics/$topicId',
				params: { topicId: created.id.toString() }
			})
		} catch {
			toast.error('Failed to create topic')
		}
	}

	let content = <LoadingSpinner containerClassName='min-h-64' />

	if (!isLoading && topics.length === 0) {
		content = (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant='icon'>
						<Library />
					</EmptyMedia>
					<EmptyTitle>No topics yet</EmptyTitle>
					<EmptyDescription>Create topics to get started</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button onClick={() => setIsCreateDialogOpen(true)}>
						<Plus />
						Create
					</Button>
				</EmptyContent>
			</Empty>
		)
	}

	if (!isLoading && topics.length > 0) {
		content = (
			<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				{topics.map(topic => (
					<TopicCard
						key={`topic-${topic.id}`}
						onClick={() =>
							navigate({
								to: '/topics/$topicId',
								params: { topicId: topic.id.toString() }
							})
						}
						topic={topic}
					/>
				))}
			</div>
		)
	}

	return (
		<PageLayout>
			<PageLayout.Header
				actions={
					<Button onClick={() => setIsCreateDialogOpen(true)}>
						<Plus />
						Create
					</Button>
				}
				icon={Library}
				title='Topics'
			/>
			<PageLayout.Content className='max-w-screen space-y-6 p-6'>
				{content}
			</PageLayout.Content>

			<Dialog onOpenChange={setIsCreateDialogOpen} open={isCreateDialogOpen}>
				<DialogContent className='sm:max-w-xl'>
					<DialogHeader>
						<DialogTitle>Create topic</DialogTitle>
					</DialogHeader>

					<div className='space-y-4'>
						<div className='space-y-1'>
							<p className='font-medium text-sm'>Title</p>
							<Input
								onChange={event => setTitle(event.target.value)}
								placeholder='Untitled topic'
								value={title}
							/>
						</div>

						<div className='space-y-1'>
							<p className='font-medium text-sm'>Body</p>
							<Textarea
								className='min-h-28'
								onChange={event => setBody(event.target.value)}
								placeholder='Write your topic...'
								value={body}
							/>
						</div>

						<div className='flex justify-end gap-2'>
							<Button
								onClick={() => setIsCreateDialogOpen(false)}
								variant='outline'
							>
								Cancel
							</Button>
							<Button disabled={isCreatingTopic} onClick={handleCreateTopic}>
								Create
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</PageLayout>
	)
}
