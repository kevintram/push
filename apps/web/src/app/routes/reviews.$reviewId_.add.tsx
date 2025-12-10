import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { SquarePen } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { SearchInput } from '~/components/search/SearchInput'
import { Button } from '~/components/ui/Button'
import { useReviewWithTopics } from '~/features/reviews/api/getReview'
import { AddedTopicsPopover } from '~/features/reviews/components/AddTopicToReviewDialog/AddedTopicsPopover'
import {
	AddTopicToReviewProvider,
	useAddTopicToReview
} from '~/features/reviews/components/AddTopicToReviewDialog/AddTopicToReviewContext'
import type { Topic } from '~/features/topics/types/topic.types'

export const Route = createFileRoute('/reviews/$reviewId_/add')({
	component: RouteComponent,
	validateSearch: (search: Record<string, unknown>) => {
		return {
			q: typeof search.q === 'string' ? search.q : undefined
		}
	}
})

function RouteComponent() {
	const { reviewId } = Route.useParams()
	const { review } = useReviewWithTopics(Number.parseInt(reviewId, 10))

	return (
		<AddTopicToReviewProvider review={review}>
			<LayoutContent />
		</AddTopicToReviewProvider>
	)
}

function LayoutContent() {
	const router = useRouter()
	const navigate = Route.useNavigate()
	const { q } = Route.useSearch()
	const inputRef = useRef<HTMLInputElement>(null)
	const [isPopoverOpen, setIsPopoverOpen] = useState(false)
	const { addTopicToReview, isCreatingTopicReview } = useAddTopicToReview()
	const { reviewId } = Route.useParams()

	const handleClose = useCallback(() => {
		navigate({
			to: '/reviews/$reviewId',
			params: { reviewId }
		})
	}, [router])

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value
			navigate({
				search: { q: value || undefined },
				replace: true,
				params: true
			})
		},
		[navigate]
	)

	const clearSearch = useCallback(() => {
		navigate({
			search: { q: undefined },
			replace: true,
			params: true
		})
	}, [navigate])

	const onCreateNewClicked = useCallback(async () => {
		const trimmedQuery = q?.trim()

		try {
			const topicReview = await addTopicToReview({
				topic: {
					name: '',
					notes: trimmedQuery || '',
					archived: false,
					inboxed: true
				}
			})

			navigate({
				to: '/reviews/$reviewId/add/topics/$topicId',
				params: {
					reviewId,
					topicId: topicReview.topic_id.toString()
				},
				search: old => old
			})
		} catch (_e) {}
	}, [q, addTopicToReview, navigate, reviewId])

	const handleTopicClick = useCallback(
		(topic: Topic) => {
			setIsPopoverOpen(false)
			navigate({
				to: '/reviews/$reviewId/add/topics/$topicId',
				params: { reviewId, topicId: topic.id.toString() },
				search: old => old
			})
		},
		[navigate, reviewId]
	)

	return (
		<div className='flex h-screen w-full flex-col'>
			{/* Header */}
			<div className='flex flex-shrink-0 items-center gap-4 border-b px-4 py-2'>
				<AddedTopicsPopover
					isOpen={isPopoverOpen}
					onOpenChange={setIsPopoverOpen}
					onTopicClick={handleTopicClick}
				/>

				<SearchInput
					inputRef={inputRef}
					onChange={handleSearchChange}
					onClear={clearSearch}
					value={q ?? ''}
				/>

				<Button
					disabled={isCreatingTopicReview}
					onClick={onCreateNewClicked}
					size='default'
					variant='secondary'
				>
					<SquarePen className='h-4 w-4' />
					Create New
				</Button>

				<Button onClick={handleClose} size='default' variant='default'>
					Done
				</Button>
			</div>

			{/* Content */}
			<div className='scrollbar-track-transparent flex-1 overflow-y-auto'>
				<Outlet />
			</div>
		</div>
	)
}
