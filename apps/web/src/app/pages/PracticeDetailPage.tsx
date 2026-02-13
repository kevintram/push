import { useNavigate, useRouter } from '@tanstack/react-router'
import { useCallback, useMemo } from 'react'
import { usePracticeWithRelationships } from '~/features/practices/api/getPractice'
import { PracticeDetail } from '~/features/practices/components/PracticeDetail/PracticeDetail'
import { PracticeContext } from '~/features/practices/stores/SelectedPracticeContext'
import { useConversionNavigate } from '~/hooks/useConversionNavigate'

interface PracticeDetailPageProps {
	practiceId: string
}

export function PracticeDetailPage({ practiceId }: PracticeDetailPageProps) {
	const navigate = useNavigate()
	const router = useRouter()
	const handleConvertSuccess = useConversionNavigate()

	const { practice, isLoading } = usePracticeWithRelationships(
		Number.parseInt(practiceId, 10)
	)

	const handleDelete = useCallback(() => {
		router.history.back()
	}, [router])

	const handleTopicNavigate = useCallback(
		(topicId: number) => {
			navigate({
				to: '/topics/$topicId',
				params: { topicId: topicId.toString() }
			})
		},
		[navigate]
	)

	const handleSourceNavigate = useCallback(
		(sourceId: number) => {
			navigate({
				to: '/sources/$sourceId',
				params: { sourceId: sourceId.toString() }
			})
		},
		[navigate]
	)

	const contextValue = useMemo(
		() => ({
			practice,
			isLoading
		}),
		[practice, isLoading]
	)

	return (
		<PracticeContext value={contextValue}>
			<PracticeDetail
				className='mx-auto max-w-5xl'
				onConvertSuccess={handleConvertSuccess}
				onDelete={handleDelete}
				onSourceNavigate={handleSourceNavigate}
				onTopicNavigate={handleTopicNavigate}
			/>
		</PracticeContext>
	)
}
