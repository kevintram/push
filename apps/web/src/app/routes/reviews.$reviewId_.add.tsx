import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Home, SquarePen, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { SearchInput } from '~/components/search/SearchInput'
import { Button } from '~/components/ui/Button'
import { useReviewWithTopics } from '~/features/reviews/api/getReview'
import { AddedTopicsPopover } from '~/features/reviews/components/AddTopicToReviewDialog/AddedTopicsPopover'
import { AddTopicSearchDialog } from '~/features/reviews/components/AddTopicToReviewDialog/AddTopicSearchDialog'
import {
	AddTopicToReviewProvider,
	useAddTopicToReview
} from '~/features/reviews/components/AddTopicToReviewDialog/AddTopicToReviewContext'
import { useAddFlowHistory } from '~/features/reviews/components/AddTopicToReviewDialog/useAddFlowHistory'
import type { Topic } from '~/features/topics/types/topic.types'

export const Route = createFileRoute('/reviews/$reviewId_/add')({
	component: RouteComponent
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
	const navigate = Route.useNavigate()
	const inputRef = useRef<HTMLInputElement>(null)
	const [isPopoverOpen, setIsPopoverOpen] = useState(false)
	const { addTopicToReview, isCreatingTopicReview } = useAddTopicToReview()
	const { reviewId } = Route.useParams()
	const { exitFlow } = useAddFlowHistory()

	// Search Dialog State
	const [isSearchOpen, setIsSearchOpen] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')

	const handleHome = useCallback(() => {
		navigate({
			to: '/reviews/$reviewId/add',
			params: { reviewId }
		})
	}, [navigate, reviewId])

	const handleClose = useCallback(() => {
		exitFlow({
			to: '/reviews/$reviewId',
			params: { reviewId }
		})
	}, [exitFlow, reviewId])

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
		const trimmedQuery = searchQuery?.trim()

		try {
			const topicReview = await addTopicToReview({
				topic: {
					name: '',
					notes: trimmedQuery || '',
					archived: false,
					inboxed: true
				}
			})

			// Close search if open
			setIsSearchOpen(false)

			navigate({
				to: '/reviews/$reviewId/add/topics/$topicId',
				params: {
					reviewId,
					topicId: topicReview.topic_id.toString()
				}
			})
		} catch (_e) {}
	}, [searchQuery, addTopicToReview, navigate, reviewId])

	const handleTopicClick = useCallback(
		(topic: Topic) => {
			setIsPopoverOpen(false)
			navigate({
				to: '/reviews/$reviewId/add/topics/$topicId',
				params: { reviewId, topicId: topic.id.toString() }
			})
		},
		[navigate, reviewId]
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
					<AddedTopicsPopover
						isOpen={isPopoverOpen}
						onOpenChange={setIsPopoverOpen}
						onTopicClick={handleTopicClick}
					/>

					<Button
						className='h-6 w-6 p-0'
						onClick={handleHome}
						size='sm'
						title='Home'
						variant='ghost'
					>
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
						disabled={isCreatingTopicReview}
						onClick={onCreateNewClicked}
						size='default'
						variant='secondary'
					>
						<SquarePen className='h-4 w-4' />
						Create New
					</Button>

					<Button onClick={handleClose} size='default' variant='ghost'>
						<X className='h-4 w-4' />
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
