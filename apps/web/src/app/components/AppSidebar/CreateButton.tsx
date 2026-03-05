import { useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { SidebarMenuButton } from '~/components/ui/sidebar'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Textarea } from '~/components/ui/textarea'
import { useCreateReviewCard } from '~/features/review-cards/api/createReviewCard'
import { useCreateTopic } from '~/features/topics/api/createTopic'
import { useTopics } from '~/features/topics/api/getTopics'

type CreateMode = 'topic' | 'practice' | 'flashcard'

export function CreateButton() {
	const navigate = useNavigate()
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [mode, setMode] = useState<CreateMode>('topic')
	const [titleOrPrompt, setTitleOrPrompt] = useState('')
	const [bodyOrAnswer, setBodyOrAnswer] = useState('')
	const [selectedTopicId, setSelectedTopicId] = useState<string>('')

	const { data: topics = [] } = useTopics({ order: 'desc' })
	const { mutateAsync: createTopicAsync, isPending: isCreatingTopic } =
		useCreateTopic()
	const {
		mutateAsync: createReviewCardAsync,
		isPending: isCreatingReviewCard
	} = useCreateReviewCard()

	const isSubmitting = isCreatingTopic || isCreatingReviewCard

	const topicOptions = useMemo(
		() =>
			topics.map(topic => ({
				id: topic.id.toString(),
				label: topic.title || `Topic #${topic.id}`
			})),
		[topics]
	)

	async function handleCreate() {
		try {
			if (mode === 'topic') {
				const created = await createTopicAsync({
					title: titleOrPrompt.trim(),
					body: bodyOrAnswer.trim(),
					parent_id: null
				})
				setIsDialogOpen(false)
				setTitleOrPrompt('')
				setBodyOrAnswer('')
				await navigate({
					to: '/topics/$topicId',
					params: { topicId: created.id.toString() }
				})
				return
			}

			const targetTopicId =
				selectedTopicId || (topicOptions[0] ? topicOptions[0].id : '')
			if (!targetTopicId) {
				toast.error('Create a topic first before adding review cards')
				return
			}

			const created = await createReviewCardAsync({
				topic_id: Number(targetTopicId),
				type: mode,
				prompt: titleOrPrompt.trim(),
				answer: bodyOrAnswer.trim(),
				srs_enabled: true
			})
			setIsDialogOpen(false)
			setTitleOrPrompt('')
			setBodyOrAnswer('')
			await navigate({
				to: '/review-cards/$reviewCardId',
				params: { reviewCardId: created.id.toString() }
			})
		} catch {
			toast.error('Failed to create item')
		}
	}

	return (
		<>
			<SidebarMenuButton
				className='bg-primary text-primary-foreground hover:bg-primary/90'
				onClick={() => setIsDialogOpen(true)}
				tooltip='Create'
			>
				<Plus />
				<span>Create</span>
			</SidebarMenuButton>

			<Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
				<DialogContent className='sm:max-w-xl'>
					<DialogHeader>
						<DialogTitle>Create</DialogTitle>
					</DialogHeader>

					<div className='space-y-4'>
						<Tabs
							onValueChange={value => {
								if (
									value === 'topic' ||
									value === 'practice' ||
									value === 'flashcard'
								) {
									setMode(value)
								}
							}}
							value={mode}
						>
							<TabsList>
								<TabsTrigger value='topic'>Topic</TabsTrigger>
								<TabsTrigger value='practice'>Practice</TabsTrigger>
								<TabsTrigger value='flashcard'>Flashcard</TabsTrigger>
							</TabsList>
						</Tabs>

						{mode !== 'topic' ? (
							<div className='space-y-1'>
								<p className='font-medium text-sm'>Topic</p>
								<select
									className='h-10 w-full rounded-md border bg-background px-3 text-sm'
									onChange={event => setSelectedTopicId(event.target.value)}
									value={selectedTopicId || topicOptions[0]?.id || ''}
								>
									{topicOptions.map(option => (
										<option key={option.id} value={option.id}>
											{option.label}
										</option>
									))}
								</select>
							</div>
						) : null}

						<div className='space-y-1'>
							<p className='font-medium text-sm'>
								{mode === 'topic' ? 'Title' : 'Prompt'}
							</p>
							<Input
								onChange={event => setTitleOrPrompt(event.target.value)}
								placeholder={
									mode === 'topic' ? 'Untitled topic' : 'Untitled prompt'
								}
								value={titleOrPrompt}
							/>
						</div>

						<div className='space-y-1'>
							<p className='font-medium text-sm'>
								{mode === 'topic' ? 'Body' : 'Answer'}
							</p>
							<Textarea
								className='min-h-28'
								onChange={event => setBodyOrAnswer(event.target.value)}
								placeholder={
									mode === 'topic'
										? 'Write your topic...'
										: 'Write your answer...'
								}
								value={bodyOrAnswer}
							/>
						</div>

						<div className='flex justify-end gap-2'>
							<Button onClick={() => setIsDialogOpen(false)} variant='outline'>
								Cancel
							</Button>
							<Button disabled={isSubmitting} onClick={handleCreate}>
								Create
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}
