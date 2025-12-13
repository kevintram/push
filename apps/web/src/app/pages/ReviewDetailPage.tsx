import { useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { Button } from '~/components/ui/Button'
import { useReviewWithTopics } from '~/features/reviews/api/getReview'
import { ReviewDetail } from '~/features/reviews/components/ReviewDetail/ReviewDetail'
import { ReviewContext } from '~/features/reviews/stores/SelectedReviewContext'

interface ReviewDetailPageProps {
	reviewId: string
}

export function ReviewDetailPage({ reviewId }: ReviewDetailPageProps) {
	const router = useRouter()

	const { review, isLoading } = useReviewWithTopics(
		Number.parseInt(reviewId, 10)
	)

	const handleDelete = useCallback(() => {
		router.history.back()
	}, [router])

	const headerBeforeActions = useMemo(
		() => (
			<Button
				className='h-6 w-6 p-0'
				onClick={() => router.history.back()}
				size='sm'
				title='Go back'
				variant='ghost'
			>
				<ArrowLeft className='h-4 w-4' />
			</Button>
		),
		[router]
	)

	const contextValue = useMemo(
		() => ({
			review,
			isLoading
		}),
		[review, isLoading]
	)

	return (
		<ReviewContext value={contextValue}>
			<ReviewDetail
				className='mx-auto max-w-5xl'
				headerBeforeActions={headerBeforeActions}
				onDelete={handleDelete}
			/>
		</ReviewContext>
	)
}
