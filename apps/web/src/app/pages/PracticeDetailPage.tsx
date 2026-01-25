import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Dumbbell } from 'lucide-react'
import { useCallback } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import { LearnableProperties } from '~/components/LearnableProperties'
import { LearnableReviewsSidebar } from '~/components/LearnableReviewsSidebar'
import { LearnableStatus } from '~/components/LearnableStatus'
import { Button } from '~/components/ui/Button'
import { SidebarHolder, SidebarProvider } from '~/components/ui/Sidebar'
import { Skeleton } from '~/components/ui/Skeleton'
import { Textarea } from '~/components/ui/Textarea'
import { usePracticeWithRelationships } from '~/features/practices/api/getPractice'
import { practiceKeys } from '~/features/practices/api/queryKeys'
import { useUpdatePractice } from '~/features/practices/api/updatePractice'
import { PracticeActionMenu } from '~/features/practices/components/PracticeActionMenu'
import { PracticeSourcesPanel } from '~/features/practices/components/PracticeSourcesPanel'
import { PracticeTopicsPanel } from '~/features/practices/components/PracticeTopicsPanel'
import type { Practice } from '~/features/practices/types/practice.types'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useLearnableMetrics } from '~/hooks/useLearnableMetrics'
import { useResizeObserver } from '~/hooks/useResizeObserver'
import { cn } from '~/lib/utils'

interface PracticeDetailPageProps {
	practiceId: string
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

function PracticeDetailSkeleton() {
	return (
		<PageLayout>
			<PageLayout.Content className='mx-auto max-w-5xl p-6'>
				<div className='space-y-4'>
					<Skeleton className='h-8 w-48' />
					<Skeleton className='h-20 w-full' />
					<Skeleton className='h-20 w-full' />
				</div>
			</PageLayout.Content>
		</PageLayout>
	)
}

export function PracticeDetailPage({ practiceId }: PracticeDetailPageProps) {
	const navigate = useNavigate()
	const router = useRouter()
	const queryClient = useQueryClient()
	const [scrollContainerRef] = useResizeObserver<HTMLDivElement>()

	const practiceIdNum = Number.parseInt(practiceId, 10)
	const { practice, isLoading } = usePracticeWithRelationships(practiceIdNum)

	const handlePracticeUpdateSuccess = useCallback(
		(updatedPractice: Practice) => {
			queryClient.setQueryData(
				practiceKeys.detail(updatedPractice.id),
				updatedPractice
			)
		},
		[queryClient]
	)

	const { mutateAsync: updatePractice } = useUpdatePractice(
		handlePracticeUpdateSuccess
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

	const handleArchiveToggle = useCallback(async () => {
		if (practice?.id) {
			await updatePractice({
				id: practice.id,
				archived: !practice.archived
			})
		}
	}, [updatePractice, practice?.id, practice?.archived])

	const handleInboxToggle = useCallback(async () => {
		if (practice?.id) {
			await updatePractice({
				id: practice.id,
				inboxed: !practice.inboxed
			})
		}
	}, [updatePractice, practice?.id, practice?.inboxed])

	const updatePrompt = useCallback(
		(newPrompt: string) => {
			if (!practice?.id) return
			updatePractice({ id: practice.id, prompt: newPrompt })
		},
		[updatePractice, practice?.id]
	)

	const updateAnswer = useCallback(
		(newAnswer: string) => {
			if (!practice?.id) return
			updatePractice({ id: practice.id, answer: newAnswer })
		},
		[updatePractice, practice?.id]
	)

	const { value: prompt, onChange: onPromptChange } = useAutoSave({
		initialValue: practice?.prompt ?? '',
		onSave: updatePrompt,
		key: `practices-${practice?.id}-prompt`
	})

	const { value: answer, onChange: onAnswerChange } = useAutoSave({
		initialValue: practice?.answer ?? '',
		onSave: updateAnswer,
		key: `practices-${practice?.id}-answer`
	})

	// Compute metrics for FSRS display using the hook
	const metrics = useLearnableMetrics(practice ?? null)

	if (isLoading || !practice) {
		return <PracticeDetailSkeleton />
	}

	return (
		<PageLayout>
			<PageLayout.Header icon={Dumbbell} title='Practice'>
				<div className='flex items-center gap-2'>
					<BrowserNavigationButtons />
					<PracticeActionMenu
						onDelete={handleDelete}
						onPracticeUpdateSuccess={handlePracticeUpdateSuccess}
						practice={practice}
					/>
				</div>
			</PageLayout.Header>
			<PageLayout.Content>
				<SidebarProvider
					cookieName='sidebar:practice-detail'
					defaultOpen={true}
					enableKeyboardShortcut={false}
				>
					<SidebarHolder className='flex min-h-0 flex-1'>
						<div
							className={cn(
								'scrollbar-track-transparent flex min-h-0 w-full flex-col overflow-y-scroll px-6 py-4'
							)}
							ref={scrollContainerRef}
						>
							{/* Status badges */}
							<LearnableStatus
								archived={practice.archived}
								inboxed={practice.inboxed}
								onArchiveToggle={handleArchiveToggle}
								onInboxToggle={handleInboxToggle}
							/>

							{/* Prompt field */}
							<div className='flex flex-col gap-1'>
								<Textarea
									className='!bg-transparent break-word !text-xl m-0 min-h-0 w-full resize-none overflow-hidden rounded-none border-none p-0 font-semibold shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
									onChange={onPromptChange}
									placeholder='Prompt'
									spellCheck={false}
									value={prompt}
								/>
							</div>

							{/* Answer field */}
							<div className='mt-4'>
								<Textarea
									className='!bg-transparent m-0 w-full resize-none overflow-hidden rounded-none border-none p-0 shadow-none focus-visible:border-none focus-visible:ring-0'
									onChange={onAnswerChange}
									placeholder='Answer'
									spellCheck={false}
									value={answer}
								/>
							</div>

							{/* Properties (timestamps, FSRS status) */}
							<div className='mt-4'>
								<LearnableProperties
									insertedAt={practice.inserted_at}
									metrics={metrics}
									updatedAt={practice.updated_at}
								/>
							</div>

							{/* Topics Panel */}
							<div className='mt-4'>
								<PracticeTopicsPanel
									getScrollElement={() => scrollContainerRef.current}
									onTopicSelect={handleTopicNavigate}
									practiceId={practice.id}
									topics={practice.topics}
								/>
							</div>

							{/* Sources Panel */}
							<div className='mt-4'>
								<PracticeSourcesPanel
									getScrollElement={() => scrollContainerRef.current}
									onSourceSelect={handleSourceNavigate}
									practiceId={practice.id}
									sources={practice.sources}
								/>
							</div>
						</div>

						{/* Reviews Sidebar */}
						<LearnableReviewsSidebar entity={practice} entityType='practice' />
					</SidebarHolder>
				</SidebarProvider>
			</PageLayout.Content>
		</PageLayout>
	)
}
