import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Home, SquarePen, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { SearchInput } from '~/components/search/SearchInput'
import { Button } from '~/components/ui/Button'
import { useCreateReview } from '~/features/reviews/api/createReview'
import { useReviewSessionWithReviews } from '~/features/reviews/api/getReviewSession'
import { AddedTopicsPopover } from '~/features/reviews/components/AddTopicToReviewDialog/AddedTopicsPopover'
import { AddTopicSearchDialog } from '~/features/reviews/components/AddTopicToReviewDialog/AddTopicSearchDialog'
import {
	AddTopicToReviewProvider,
	useAddTopicToReview
} from '~/features/reviews/components/AddTopicToReviewDialog/AddTopicToReviewContext'
import { useAddFlowHistory } from '~/features/reviews/components/AddTopicToReviewDialog/useAddFlowHistory'
import type { Rating } from '~/features/reviews/types/review.types'
import type { Topic } from '~/features/topics/types/topic.types'

export const Route = createFileRoute('/review-session/$reviewSessionId_/add')({
	component: RouteComponent
})

function RouteComponent() {
	const { reviewSessionId } = Route.useParams()
	const { reviewSession: review } = useReviewSessionWithReviews(
		Number.parseInt(reviewSessionId, 10)
	)

	return (
		<AddTopicToReviewProvider review={review}>
			<LayoutContent />
		</AddTopicToReviewProvider>
	)
}

function LayoutContent() {
	const navigate = Route.useNavigate()
	const inputRef = useRef<HTMLInputElement>(null)
	const [isPopoverOpen, setIsPopoverOpen] = useState(false)
	const { review, isReviewCompleted } = useAddTopicToReview()
	const createReviewMutation = useCreateReview()
	const { reviewSessionId } = Route.useParams()
	const { exitFlow } = useAddFlowHistory()

	// Search Dialog State
	const [isSearchOpen, setIsSearchOpen] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')

	const handleHome = useCallback(() => {
		navigate({
			to: '/review-session/$reviewSessionId/add',
			params: { reviewSessionId }
		})
	}, [navigate, reviewSessionId])

	const handleClose = useCallback(() => {
		exitFlow({
			to: '/review-session/$reviewSessionId',
			params: { reviewSessionId }
		})
	}, [exitFlow, reviewSessionId])

	const handleSearchFocus = useCallback(() => {
		setIsSearchOpen(true)
	}, [])

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setSearchQuery(e.target.value)
			if (!isSearchOpen) {
				setIsSearchOpen(true)
			}
		},
		[isSearchOpen]
	)

	const clearSearch = useCallback(() => {
		setSearchQuery('')
	}, [])

	const onCreateNewClicked = useCallback(async () => {
		if (!review) return

		const trimmedQuery = searchQuery?.trim()
		const ratingValue: Rating | null = isReviewCompleted ? 'good' : null

		try {
			const topicReview = await createReviewMutation.mutateAsync({
				review_session_id: review.id,
				topic: {
					name: '',
					notes: trimmedQuery || '',
					archived: false,
					inboxed: true
				},
				rating: ratingValue
			})

			// Close search if open
			setIsSearchOpen(false)

			navigate({
				to: '/review-session/$reviewSessionId/add/topics/$topicId',
				params: {
					reviewSessionId,
					topicId: topicReview.topic_id.toString()
				}
			})
		} catch (_e) {}
	}, [
		searchQuery,
		review,
		isReviewCompleted,
		createReviewMutation,
		navigate,
		reviewSessionId
	])

	const handleTopicClick = useCallback(
		(topic: Topic) => {
			setIsPopoverOpen(false)
			navigate({
				to: '/review-session/$reviewSessionId/add/topics/$topicId',
				params: { reviewSessionId, topicId: topic.id.toString() }
			})
		},
		[navigate, reviewSessionId]
	)

	return (
		<div className='flex h-screen w-full flex-col'>
			<AddTopicSearchDialog
				onOpenChange={setIsSearchOpen}
				open={isSearchOpen}
				query={searchQuery}
				setQuery={setSearchQuery}
			/>

			{/* Header */}
			<div className='flex-shrink-0 border-b py-2'>
				<div className='flex items-center gap-4 px-4'>
					<Button onClick={handleClose} size='icon' variant='ghost'>
						<X className='h-4 w-4' />
					</Button>

					<AddedTopicsPopover
						isOpen={isPopoverOpen}
						onOpenChange={setIsPopoverOpen}
						onTopicClick={handleTopicClick}
					/>

					<Button onClick={handleHome} size='icon' title='Home' variant='ghost'>
						<Home className='h-4 w-4' />
					</Button>

					<SearchInput
						inputRef={inputRef}
						onChange={handleSearchChange}
						onClear={clearSearch}
						onFocus={handleSearchFocus}
						value={searchQuery}
					/>

					<Button
						disabled={createReviewMutation.isPending}
						onClick={onCreateNewClicked}
						size='default'
						variant='secondary'
					>
						<SquarePen className='h-4 w-4' />
						Create New
					</Button>
				</div>
			</div>

			{/* Content */}
			<div className='scrollbar-track-transparent flex-1 overflow-y-auto'>
				<Outlet />
			</div>
		</div>
	)
}
