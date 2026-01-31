import dayjs from 'dayjs'
import { Anvil, Inbox, Plus, RotateCcw, SquareStack } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/Button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/Dialog'
import { Switch } from '~/components/ui/Switch'
import { Textarea } from '~/components/ui/Textarea'
import { Toggle } from '~/components/ui/Toggle'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { useAddPracticeSource } from '~/features/practices/api/addPracticeSource'
import { useCreateReview } from '~/features/reviews/api/createReview'
import {
	ReviewRatingCheckbox,
	type ReviewRatingState
} from '~/features/reviews/components/ReviewRatingCheckbox'
import { SessionPickerPopover } from '~/features/reviews/components/SessionPickerPopover'
import { useAddTopicEntityRelation } from '~/features/topics/api/addTopicEntityRelation'
import { useAddTopicSource } from '~/features/topics/api/addTopicSource'
import { EntityType } from '~/models/entity-relations.types'
import type { LearningState } from '~/models/learning-state.types'
import { useAddSourceChild } from '../api/addSourceChild'
import { useAddSourceEntityRelation } from '../api/addSourceEntityRelation'
import { useAddSourcePrerequisite } from '../api/addSourcePrerequisite'
import { useCreateSource } from '../api/createSource'
import { useSetSourceParent } from '../api/setSourceParent'

/**
 * SRS fields that can be inherited from a parent source.
 */
export type SrsSource = {
	stability: number | null
	difficulty: number | null
	state: LearningState | null
	step: number | null
	lastReviewedAt: string | null
}

export type AddSourceDialogContext =
	| { type: 'standalone' }
	| { type: 'child'; parentSourceId: number; srsSource?: SrsSource | null }
	| { type: 'parent'; childSourceId: number }
	| { type: 'topic'; topicId: number }
	| { type: 'practice'; practiceId: number }
	| { type: 'topicRelated'; topicId: number }
	| { type: 'sourceRelated'; sourceId: number }
	| { type: 'sourcePrerequisite'; sourceId: number }

interface AddSourceDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	context?: AddSourceDialogContext
	onSuccess?: (sourceId: number) => void
}

export function AddSourceDialog({
	open,
	onOpenChange,
	context = { type: 'standalone' },
	onSuccess
}: AddSourceDialogProps) {
	// Source fields
	const [title, setTitle] = useState('')
	const [notes, setNotes] = useState('')

	// Review fields
	const [showReview, setShowReview] = useState(false)
	const [reviewRating, setReviewRating] =
		useState<ReviewRatingState>('uncompleted')
	const [reviewDescription, setReviewDescription] = useState('')
	const [reviewNotes, setReviewNotes] = useState('')
	const [reviewSessionId, setReviewSessionId] = useState<number | null>(null)
	const [isSessionPopoverOpen, setIsSessionPopoverOpen] = useState(false)

	// Toggle states
	const [inboxed, setInboxed] = useState(false)
	const [inheritStability, setInheritStability] = useState(false)
	const [srsEnabled, setSrsEnabled] = useState(false)

	// Footer state
	const [createMore, setCreateMore] = useState(false)

	// Refs
	const titleRef = useRef<HTMLTextAreaElement>(null)

	// Mutations
	const { mutateAsync: createSource, isPending: isCreatingSource } =
		useCreateSource()
	const { mutateAsync: addSourceChild, isPending: isAddingChild } =
		useAddSourceChild()
	const { mutateAsync: setSourceParent, isPending: isSettingParent } =
		useSetSourceParent()
	const { mutateAsync: addTopicSource, isPending: isAddingTopicSource } =
		useAddTopicSource()
	const {
		mutateAsync: addTopicSourceRelation,
		isPending: isAddingTopicRelation
	} = useAddTopicEntityRelation()
	const { mutateAsync: addPracticeSource, isPending: isAddingPracticeSource } =
		useAddPracticeSource()
	const { mutateAsync: addSourceRelation, isPending: isAddingSourceRelation } =
		useAddSourceEntityRelation()
	const {
		mutateAsync: addSourcePrerequisite,
		isPending: isAddingSourcePrerequisite
	} = useAddSourcePrerequisite()
	const { mutateAsync: createReview, isPending: isCreatingReview } =
		useCreateReview()

	const isPending =
		isCreatingSource ||
		isAddingChild ||
		isSettingParent ||
		isAddingTopicSource ||
		isAddingTopicRelation ||
		isAddingPracticeSource ||
		isAddingSourceRelation ||
		isAddingSourcePrerequisite ||
		isCreatingReview

	// Extract SRS source from context if available
	const srsSource = useMemo(() => {
		if (context.type === 'child') {
			return context.srsSource ?? null
		}
		return null
	}, [context])

	// Focus title field on open
	useEffect(() => {
		if (open && titleRef.current) {
			// Small delay to ensure dialog is rendered
			requestAnimationFrame(() => {
				titleRef.current?.focus()
			})
		}
	}, [open])

	// Reset content fields (for create more)
	const resetContentFields = useCallback(() => {
		setTitle('')
		setNotes('')
		setShowReview(false)
		setReviewRating('uncompleted')
		setReviewDescription('')
		setReviewNotes('')
		setReviewSessionId(null)
	}, [])

	// Reset toggle fields to defaults
	const resetToggleFields = useCallback(() => {
		setInboxed(false)
		setInheritStability(false)
		setSrsEnabled(false)
	}, [])

	// Reset all fields when dialog opens
	useEffect(() => {
		if (open) {
			resetContentFields()
			resetToggleFields()
			setCreateMore(false)
		}
	}, [open, resetContentFields, resetToggleFields])

	// Handle rating change
	const handleRatingChange = useCallback((newRating: ReviewRatingState) => {
		setReviewRating(newRating)
	}, [])

	// Create source handler
	const handleCreate = useCallback(async () => {
		try {
			let newSourceId: number | undefined

			// Build source data - inherit all SRS fields when toggle is on
			const shouldInherit = inheritStability && srsSource !== null

			const sourceData = {
				title: title.trim(),
				notes: notes.trim(),
				archived: false,
				inboxed,
				srs_enabled: srsEnabled,
				inherit_fsrs: shouldInherit
			}

			if (context.type === 'standalone') {
				const source = await createSource({
					...sourceData,
					parent_id: null
				})
				newSourceId = source.id
			} else if (context.type === 'child') {
				const response = await addSourceChild({
					parentId: context.parentSourceId,
					data: { child: sourceData }
				})
				newSourceId = response.child.id
			} else if (context.type === 'parent') {
				const response = await setSourceParent({
					sourceId: context.childSourceId,
					parent: sourceData
				})
				newSourceId = response.parent.id
			} else if (context.type === 'topic') {
				const response = await addTopicSource({
					topicId: context.topicId,
					source: sourceData
				})
				newSourceId = response.source.id
			} else if (context.type === 'practice') {
				const response = await addPracticeSource({
					practiceId: context.practiceId,
					source: sourceData
				})
				newSourceId = response.source.id
			} else if (context.type === 'topicRelated') {
				await addTopicSourceRelation({
					topicId: context.topicId,
					data: {
						to_entity_type: EntityType.Source,
						to_source: sourceData
					}
				})
			} else if (context.type === 'sourceRelated') {
				await addSourceRelation({
					sourceId: context.sourceId,
					data: {
						to_entity_type: EntityType.Source,
						to_source: sourceData
					}
				})
			} else if (context.type === 'sourcePrerequisite') {
				await addSourcePrerequisite({
					sourceId: context.sourceId,
					data: {
						prereq_entity_type: EntityType.Source,
						prereq_source: sourceData
					}
				})
			}

			// Create review if review section was used and rating was set
			if (newSourceId && showReview && reviewRating !== 'uncompleted') {
				const basePayload = {
					source_id: newSourceId,
					rating: reviewRating,
					description: reviewDescription.trim(),
					notes: reviewNotes.trim(),
					completed_at: dayjs().format('YYYY-MM-DD')
				} as const

				if (reviewSessionId != null) {
					await createReview({
						...basePayload,
						review_session_id: reviewSessionId
					})
				} else {
					await createReview(basePayload)
				}
			}

			// Call success callback
			if (newSourceId) {
				onSuccess?.(newSourceId)
			}

			// Handle create more vs close
			if (createMore) {
				resetContentFields()
				// Focus title field again
				requestAnimationFrame(() => {
					titleRef.current?.focus()
				})
			} else {
				onOpenChange(false)
			}
		} catch (_error) {
			toast.error('Failed to create source')
		}
	}, [
		title,
		notes,
		inboxed,
		srsEnabled,
		context,
		srsSource,
		inheritStability,
		createSource,
		addSourceChild,
		setSourceParent,
		addTopicSource,
		addTopicSourceRelation,
		addPracticeSource,
		addSourceRelation,
		addSourcePrerequisite,
		showReview,
		reviewRating,
		reviewDescription,
		reviewNotes,
		reviewSessionId,
		createReview,
		onSuccess,
		createMore,
		resetContentFields,
		onOpenChange
	])

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className='flex max-h-[85vh] flex-col sm:max-w-[500px]'>
				<DialogHeader>
					<DialogTitle>New Source</DialogTitle>
				</DialogHeader>

				<div className='flex flex-1 flex-col gap-4 overflow-y-auto py-2'>
					{/* Title and Notes */}
					<div className='flex flex-col gap-2'>
						<Textarea
							className='!bg-transparent break-word !text-xl m-0 min-h-0 w-full resize-none overflow-hidden rounded-none border-none p-0 font-semibold shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
							onChange={e => setTitle(e.target.value)}
							placeholder='Title'
							ref={titleRef}
							spellCheck={false}
							value={title}
						/>
						<Textarea
							className='!bg-transparent m-0 w-full resize-none overflow-hidden rounded-none border-none p-0 shadow-none focus-visible:border-none focus-visible:ring-0'
							onChange={e => setNotes(e.target.value)}
							placeholder='Notes'
							spellCheck={false}
							value={notes}
						/>
					</div>

					{/* Add First Review Section */}
					{showReview ? (
						<div className='rounded-lg border p-3'>
							<div className='flex items-start gap-3'>
								<ReviewRatingCheckbox
									className='translate-y-0.5'
									onChange={handleRatingChange}
									value={reviewRating}
								/>
								<div className='flex min-w-0 flex-1 flex-col gap-2'>
									<Textarea
										className='!bg-transparent m-0 resize-none overflow-hidden rounded-none border-none p-0 font-bold shadow-none [overflow-wrap:anywhere] focus:outline-none focus-visible:border-none focus-visible:ring-0'
										onChange={e => setReviewDescription(e.target.value)}
										placeholder='Description'
										spellCheck={false}
										value={reviewDescription}
									/>
									<Textarea
										className='!bg-transparent m-0 resize-none overflow-hidden rounded-none border-none p-0 shadow-none focus-visible:border-none focus-visible:ring-0'
										onChange={e => setReviewNotes(e.target.value)}
										placeholder='Notes'
										spellCheck={false}
										value={reviewNotes}
									/>
								</div>
								<SessionPickerPopover
									allowCreate={false}
									isOpen={isSessionPopoverOpen}
									onOpenChange={setIsSessionPopoverOpen}
									onSessionChange={setReviewSessionId}
									selectedSessionId={reviewSessionId}
									trigger={
										<Button
											className='h-8 flex-shrink-0 gap-1 px-2'
											size='sm'
											variant='ghost'
										>
											<SquareStack className='h-4 w-4' />
											<span className='max-w-[80px] truncate text-xs'>
												{reviewSessionId ? 'Session' : 'No session'}
											</span>
										</Button>
									}
								/>
							</div>
						</div>
					) : (
						<Button
							className='w-fit'
							onClick={() => setShowReview(true)}
							size='sm'
							variant='outline'
						>
							<Plus className='h-4 w-4' />
							Add first review
						</Button>
					)}

					{/* Bottom Controls */}
					<div className='flex flex-wrap items-center gap-2 border-t pt-4'>
						{/* Inbox Toggle */}
						<Tooltip>
							<TooltipTrigger asChild={true}>
								<span>
									<Toggle
										aria-label='Add to inbox'
										onPressedChange={setInboxed}
										pressed={inboxed}
										size='sm'
										variant='outline'
									>
										<Inbox className='h-4 w-4' />
									</Toggle>
								</span>
							</TooltipTrigger>
							<TooltipContent>Add to inbox</TooltipContent>
						</Tooltip>

						{/* Inherit SRS Toggle (for child context with source stability) */}
						{srsSource !== null && (
							<Tooltip>
								<TooltipTrigger asChild={true}>
									<span>
										<Toggle
											aria-label='Inherit SRS state'
											onPressedChange={setInheritStability}
											pressed={inheritStability}
											size='sm'
											variant='outline'
										>
											<Anvil className='h-4 w-4' />
											<span className='ml-1 text-xs'>Inherit SRS</span>
										</Toggle>
									</span>
								</TooltipTrigger>
								<TooltipContent>
									Inherit SRS state from parent source
								</TooltipContent>
							</Tooltip>
						)}

						{/* Show When Due Switch */}
						<div className='flex items-center gap-1.5 rounded-md border px-2 py-1'>
							<span className='text-xs'>Show when due</span>
							<Switch
								checked={srsEnabled}
								onCheckedChange={setSrsEnabled}
								size='xs'
							/>
						</div>

						{/* Reset Button */}
						<Tooltip>
							<TooltipTrigger asChild={true}>
								<Button onClick={resetToggleFields} size='sm' variant='ghost'>
									<RotateCcw className='h-4 w-4' />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Reset options to defaults</TooltipContent>
						</Tooltip>
					</div>
				</div>

				<DialogFooter className='flex-row items-center justify-between sm:justify-between'>
					<div className='flex items-center gap-2'>
						<span className='text-muted-foreground text-xs'>Create more</span>
						<Switch
							checked={createMore}
							onCheckedChange={setCreateMore}
							size='xs'
						/>
					</div>
					<Button disabled={isPending} onClick={handleCreate}>
						{isPending ? 'Creating...' : 'Done'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
