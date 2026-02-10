import { useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { Button } from '~/components/ui/Button'
import { SidebarTrigger } from '~/components/ui/Sidebar'
import { useSourceWithRelationships } from '~/features/sources/api/getSource'
import {
	SourceDetail,
	type SourceDetailTab
} from '~/features/sources/components/SourceDetail/SourceDetail'
import { SourceContext } from '~/features/sources/stores/SelectedSourceContext'
import { useConversionNavigate } from '~/hooks/useConversionNavigate'

interface SourceDetailPageProps {
	sourceId: string
	activeTab?: SourceDetailTab
}

function BrowserNavigationButtons() {
	const router = useRouter()

	return (
		<Button
			className='h-6 w-6 p-0'
			onClick={() => router.history.back()}
			size='sm'
			title='Go back'
			variant='ghost'
		>
			<ArrowLeft className='h-4 w-4' />
		</Button>
	)
}

export function SourceDetailPage({
	sourceId,
	activeTab = 'children'
}: SourceDetailPageProps) {
	const navigate = useNavigate()
	const router = useRouter()
	const handleConvertSuccess = useConversionNavigate()

	const { source, isLoading } = useSourceWithRelationships(
		Number.parseInt(sourceId, 10)
	)

	const handleDelete = useCallback(() => {
		router.history.back()
	}, [router])

	const handleSourceNavigate = useCallback(
		(sourceId: number) => {
			navigate({
				to: '/sources/$sourceId',
				params: { sourceId: sourceId.toString() }
			})
		},
		[navigate]
	)

	const handleTopicNavigate = useCallback(
		(topicId: number) => {
			navigate({
				to: '/topics/$topicId',
				params: { topicId: topicId.toString() }
			})
		},
		[navigate]
	)

	const handlePracticeNavigate = useCallback(
		(practiceId: number) => {
			navigate({
				to: '/practices/$practiceId',
				params: { practiceId: practiceId.toString() }
			})
		},
		[navigate]
	)

	const handleTabChange = useCallback(
		(nextTab: SourceDetailTab) => {
			if (nextTab === activeTab) return
			if (nextTab === 'children') {
				navigate({
					replace: true,
					to: '/sources/$sourceId',
					params: { sourceId }
				})
				return
			}
			if (nextTab === 'practice') {
				navigate({
					replace: true,
					to: '/sources/$sourceId/practice',
					params: { sourceId }
				})
				return
			}
			if (nextTab === 'topics') {
				navigate({
					replace: true,
					to: '/sources/$sourceId/topics',
					params: { sourceId }
				})
				return
			}
			if (nextTab === 'prerequisites') {
				navigate({
					replace: true,
					to: '/sources/$sourceId/prerequisites',
					params: { sourceId }
				})
				return
			}
			navigate({
				replace: true,
				to: '/sources/$sourceId/related',
				params: { sourceId }
			})
		},
		[activeTab, navigate, sourceId]
	)

	const contextValue = useMemo(
		() => ({
			source,
			isLoading
		}),
		[source, isLoading]
	)

	return (
		<SourceContext value={contextValue}>
			<SourceDetail
				activeTab={activeTab}
				className='mx-auto max-w-5xl'
				headerAfterActions={<SidebarTrigger />}
				headerBeforeActions={<BrowserNavigationButtons />}
				onConvertSuccess={handleConvertSuccess}
				onDelete={handleDelete}
				onPracticeNavigate={handlePracticeNavigate}
				onSourceNavigate={handleSourceNavigate}
				onTabChange={handleTabChange}
				onTopicNavigate={handleTopicNavigate}
			/>
		</SourceContext>
	)
}
