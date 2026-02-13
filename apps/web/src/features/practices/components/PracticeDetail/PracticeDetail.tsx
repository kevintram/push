import { useQueryClient } from '@tanstack/react-query'
import {
	type ReactElement,
	type ReactNode,
	use,
	useCallback,
	useMemo,
	useRef,
	useState
} from 'react'
import { ConversionConfirmationDialog } from '~/components/ConversionConfirmationDialog'
import { DetailTabsShell } from '~/components/DetailTabs'
import { LearnableDetailHeader } from '~/components/LearnableDetailHeader'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { Textarea } from '~/components/ui/textarea'
import { useConvertPracticeToSource } from '~/features/practices/api/convertPracticeToSource'
import { useConvertPracticeToTopic } from '~/features/practices/api/convertPracticeToTopic'
import { useAutoSave } from '~/hooks/useAutoSave'
import type { OnConversionSuccess } from '~/hooks/useConversionNavigate'
import { useFsrsState } from '~/hooks/useFsrsState'
import { useLearnableMetrics } from '~/hooks/useLearnableMetrics'
import { cn } from '~/lib/utils'
import { ConversionError } from '~/utils/ConversionError'
import {
	getPracticeToSourcePreview,
	getPracticeToTopicPreview
} from '~/utils/conversionPreview'
import { practiceKeys } from '../../api/queryKeys'
import { useUpdatePractice } from '../../api/updatePractice'
import { PracticeContext } from '../../stores/SelectedPracticeContext'
import type { Practice } from '../../types/practice.types'
import { PracticeActionMenu } from '../PracticeActionMenu'
import { PracticeRelatedPanel } from '../PracticeRelatedPanel'
import { PracticeDetailNavBar } from './PracticeDetailNavBar'
import { PracticeDetailSkeleton } from './PracticeDetailSkeleton'

interface PracticeTypeChangeMenuProps {
	practice: Practice
	onConvertSuccess?: OnConversionSuccess
	trigger: ReactElement
}

function PracticeTypeChangeMenu({
	practice,
	onConvertSuccess,
	trigger
}: PracticeTypeChangeMenuProps) {
	const [convertToTopicOpen, setConvertToTopicOpen] = useState(false)
	const [convertToSourceOpen, setConvertToSourceOpen] = useState(false)
	const [convertToTopicError, setConvertToTopicError] = useState<string | null>(
		null
	)
	const [convertToSourceError, setConvertToSourceError] = useState<
		string | null
	>(null)
	const convertToTopicMutation = useConvertPracticeToTopic()
	const convertToSourceMutation = useConvertPracticeToSource()

	const toTopicPreview = useMemo(
		() => getPracticeToTopicPreview(practice),
		[practice]
	)
	const toSourcePreview = useMemo(
		() => getPracticeToSourcePreview(practice),
		[practice]
	)

	const handleConfirmConvertToTopic = useCallback(async () => {
		try {
			const result = await convertToTopicMutation.mutateAsync({
				practiceId: practice.id
			})
			setConvertToTopicOpen(false)
			onConvertSuccess?.('topic', result.topic_id)
		} catch (error) {
			if (error instanceof ConversionError) {
				setConvertToTopicError(error.message)
			} else {
				setConvertToTopicError('Failed to convert practice to topic')
			}
		}
	}, [convertToTopicMutation, practice.id, onConvertSuccess])

	const handleConfirmConvertToSource = useCallback(async () => {
		try {
			const result = await convertToSourceMutation.mutateAsync({
				practiceId: practice.id
			})
			setConvertToSourceOpen(false)
			onConvertSuccess?.('source', result.source_id)
		} catch (error) {
			if (error instanceof ConversionError) {
				setConvertToSourceError(error.message)
			} else {
				setConvertToSourceError('Failed to convert practice to source')
			}
		}
	}, [convertToSourceMutation, practice.id, onConvertSuccess])

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger render={trigger} />
				<DropdownMenuContent align='start' side='bottom' sideOffset={4}>
					<DropdownMenuGroup>
						<DropdownMenuLabel>Change type</DropdownMenuLabel>
						<DropdownMenuItem onClick={() => setConvertToTopicOpen(true)}>
							Topic
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setConvertToSourceOpen(true)}>
							Source
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>

			<ConversionConfirmationDialog
				blockers={toTopicPreview.blockers}
				entityName={practice.prompt}
				error={convertToTopicError}
				isPending={convertToTopicMutation.isPending}
				lost={toTopicPreview.lost}
				migrated={toTopicPreview.migrated}
				onConfirm={handleConfirmConvertToTopic}
				onOpenChange={open => {
					setConvertToTopicOpen(open)
					if (!open) setConvertToTopicError(null)
				}}
				open={convertToTopicOpen}
				targetEntityType='Topic'
			/>

			<ConversionConfirmationDialog
				blockers={toSourcePreview.blockers}
				entityName={practice.prompt}
				error={convertToSourceError}
				isPending={convertToSourceMutation.isPending}
				lost={toSourcePreview.lost}
				migrated={toSourcePreview.migrated}
				onConfirm={handleConfirmConvertToSource}
				onOpenChange={open => {
					setConvertToSourceOpen(open)
					if (!open) setConvertToSourceError(null)
				}}
				open={convertToSourceOpen}
				targetEntityType='Source'
			/>
		</>
	)
}

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
			<PracticeDetailNavBar afterActions={headerAfterActions} />
			<div className='flex min-h-0 flex-1'>
				<div
					className='scrollbar-track-transparent flex min-h-0 w-full flex-col overflow-y-scroll'
					ref={scrollContainerRef}
				>
					<div className={cn('w-full px-6 pt-6 pb-4', className)}>
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
							renderTypeChangeMenu={trigger => (
								<PracticeTypeChangeMenu
									onConvertSuccess={onConvertSuccess}
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

						<div className='mt-6'>
							<DetailTabsShell
								defaultValue='related'
								tabs={[
									{
										value: 'related',
										label: 'Related',
										count:
											(practice.topics?.length ?? 0) +
											(practice.sources?.length ?? 0),
										content: (
											<PracticeRelatedPanel
												getScrollElement={getScrollElement}
												inheritFsrsState={srsSource}
												onSourceSelect={onSourceNavigate}
												onTopicSelect={onTopicNavigate}
												practiceId={practice.id}
												sources={practice.sources}
												topics={practice.topics}
											/>
										)
									}
								]}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
