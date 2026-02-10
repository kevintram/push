import { useQueryClient } from '@tanstack/react-query'
import { type ReactNode, use, useCallback, useRef } from 'react'
import { LearnableDetailHeader } from '~/components/LearnableDetailHeader'
import { Textarea } from '~/components/ui/Textarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import type { OnConversionSuccess } from '~/hooks/useConversionNavigate'
import { useFsrsState } from '~/hooks/useFsrsState'
import { useLearnableMetrics } from '~/hooks/useLearnableMetrics'
import { cn } from '~/lib/utils'
import { practiceKeys } from '../../api/queryKeys'
import { useUpdatePractice } from '../../api/updatePractice'
import { PracticeContext } from '../../stores/SelectedPracticeContext'
import type { Practice } from '../../types/practice.types'
import { PracticeActionMenu } from '../PracticeActionMenu'
import { PracticeSourcesPanel } from '../PracticeSourcesPanel'
import { PracticeTopicsPanel } from '../PracticeTopicsPanel'
import { PracticeDetailNavBar } from './PracticeDetailNavBar'
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
	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const getScrollElement = useCallback(() => scrollContainerRef.current, [])

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

	const handleSrsToggle = useCallback(
		async (pressed: boolean) => {
			if (!practice?.id) return
			await updatePractice({
				id: practice.id,
				srs_enabled: pressed
			})
		},
		[updatePractice, practice?.id]
	)

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
		<div className='flex h-full min-h-0 flex-col'>
			<PracticeDetailNavBar
				afterActions={headerAfterActions}
				headerBeforeActions={headerBeforeActions}
			/>
			<div className='flex min-h-0 flex-1'>
				<div
					className='scrollbar-track-transparent flex min-h-0 w-full flex-col overflow-y-scroll'
					ref={scrollContainerRef}
				>
					<div className={cn('w-full px-6 pt-2 pb-4', className)}>
						<LearnableDetailHeader
							archived={practice.archived}
							createdAt={practice.inserted_at}
							entityId={practice.id}
							entityLabel='Practice'
							entityType='practice'
							inboxed={practice.inboxed}
							isUpdating={false}
							metrics={metrics}
							onArchiveToggle={handleArchiveToggle}
							onInboxToggle={handleInboxToggle}
							onSrsToggle={handleSrsToggle}
							onTitleChange={onPromptChange}
							renderActionMenu={trigger => (
								<PracticeActionMenu
									hideInboxArchive={true}
									onConvertSuccess={onConvertSuccess}
									onDelete={onDelete}
									onPracticeUpdateSuccess={handlePracticeUpdateSuccess}
									practice={practice}
									trigger={trigger}
								/>
							)}
							srsEnabled={practice.srs_enabled}
							title={prompt}
							titlePlaceholder='Prompt'
							updatedAt={practice.updated_at}
						/>

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

						{/* Topics Panel */}
						<div className='mt-4'>
							<PracticeTopicsPanel
								getScrollElement={getScrollElement}
								inheritFsrsState={srsSource}
								onTopicSelect={onTopicNavigate}
								practiceId={practice.id}
								topics={practice.topics}
							/>
						</div>

						{/* Sources Panel */}
						<div className='mt-4'>
							<PracticeSourcesPanel
								getScrollElement={getScrollElement}
								inheritFsrsState={srsSource}
								onSourceSelect={onSourceNavigate}
								practiceId={practice.id}
								sources={practice.sources}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
