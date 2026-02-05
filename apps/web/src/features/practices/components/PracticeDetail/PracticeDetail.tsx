import { useQueryClient } from '@tanstack/react-query'
import { type ReactNode, use, useCallback } from 'react'
import { LearnableProperties } from '~/components/LearnableProperties'
import { LearnableReviewsSidebar } from '~/components/LearnableReviewsSidebar'
import { LearnableStatus } from '~/components/LearnableStatus'
import { SidebarHolder, SidebarProvider } from '~/components/ui/Sidebar'
import { Textarea } from '~/components/ui/Textarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import type { OnConversionSuccess } from '~/hooks/useConversionNavigate'
import { useFsrsState } from '~/hooks/useFsrsState'
import { useLearnableMetrics } from '~/hooks/useLearnableMetrics'
import { useResizeObserver } from '~/hooks/useResizeObserver'
import { cn } from '~/lib/utils'
import { practiceKeys } from '../../api/queryKeys'
import { useUpdatePractice } from '../../api/updatePractice'
import { PracticeContext } from '../../stores/SelectedPracticeContext'
import type { Practice } from '../../types/practice.types'
import { PracticeActionMenu } from '../PracticeActionMenu'
import { PracticeSourcesPanel } from '../PracticeSourcesPanel'
import { PracticeTopicsPanel } from '../PracticeTopicsPanel'
import { PracticeDetailHeader } from './PracticeDetailHeader'
import { PracticeDetailSkeleton } from './PracticeDetailSkeleton'

interface PracticeDetailProps {
	/**
	 * The practice to display. If not provided, reads from PracticeContext.
	 */
	practice?: Practice | null
	/**
	 * Loading state. If not provided, reads from PracticeContext.
	 */
	isLoading?: boolean
	/**
	 * Content to render in the left section before the type indicator (e.g., navigation buttons).
	 */
	headerBeforeActions?: ReactNode
	/**
	 * Content to render on the right side of the header (e.g., close/minimize buttons).
	 */
	headerAfterActions?: ReactNode
	/**
	 * Callback when the practice is successfully converted to another entity type.
	 */
	onConvertSuccess?: OnConversionSuccess
	/**
	 * Callback when the practice is deleted.
	 */
	onDelete?: () => void | Promise<void>
	/**
	 * Callback when navigating to a topic (topic click in topics panel).
	 * If not provided, uses default dialog behavior.
	 */
	onTopicNavigate?: (topicId: number) => void
	/**
	 * Callback when navigating to a source (source click in sources panel).
	 * If not provided, uses default dialog behavior.
	 */
	onSourceNavigate?: (sourceId: number) => void
	/**
	 * Optional className to apply to the scroll container
	 */
	className?: string
}

export function PracticeDetail({
	practice: practiceProp,
	isLoading: isLoadingProp,
	headerBeforeActions,
	headerAfterActions,
	onConvertSuccess,
	onDelete,
	onTopicNavigate,
	onSourceNavigate,
	className
}: PracticeDetailProps) {
	// Get practice from context if not provided via props
	const contextValue = use(PracticeContext)
	const practice =
		practiceProp !== undefined ? practiceProp : contextValue.practice
	const isLoading =
		isLoadingProp !== undefined ? isLoadingProp : contextValue.isLoading

	const queryClient = useQueryClient()
	const [scrollContainerRef] = useResizeObserver<HTMLDivElement>()

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

	const srsSource = useFsrsState(practice)

	if (isLoading || !practice) {
		return <PracticeDetailSkeleton />
	}

	return (
		<SidebarProvider
			cookieName='sidebar:practice-detail'
			defaultOpen={true}
			enableKeyboardShortcut={false}
		>
			<div className='flex h-full min-h-0 flex-col'>
				<PracticeDetailHeader
					afterActions={headerAfterActions}
					headerBeforeActions={headerBeforeActions}
				/>
				<SidebarHolder className='flex min-h-0 flex-1'>
					<div
						className={cn(
							'scrollbar-track-transparent flex min-h-0 w-full flex-col overflow-y-scroll px-6 py-4',
							className
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

						{/* Prompt field with action menu */}
						<div className='flex items-start gap-2'>
							<div className='flex flex-1 flex-col gap-1'>
								<Textarea
									className='!bg-transparent break-word !text-xl m-0 min-h-0 w-full resize-none overflow-hidden rounded-none border-none p-0 font-semibold shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
									onChange={onPromptChange}
									placeholder='Prompt'
									spellCheck={false}
									value={prompt}
								/>
							</div>
							<PracticeActionMenu
								onConvertSuccess={onConvertSuccess}
								onDelete={onDelete}
								onPracticeUpdateSuccess={handlePracticeUpdateSuccess}
								practice={practice}
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
								inheritFsrsState={srsSource}
								onTopicSelect={onTopicNavigate}
								practiceId={practice.id}
								topics={practice.topics}
							/>
						</div>

						{/* Sources Panel */}
						<div className='mt-4'>
							<PracticeSourcesPanel
								getScrollElement={() => scrollContainerRef.current}
								inheritFsrsState={srsSource}
								onSourceSelect={onSourceNavigate}
								practiceId={practice.id}
								sources={practice.sources}
							/>
						</div>
					</div>

					{/* Reviews Sidebar */}
					<LearnableReviewsSidebar entity={practice} entityType='practice' />
				</SidebarHolder>
			</div>
		</SidebarProvider>
	)
}
