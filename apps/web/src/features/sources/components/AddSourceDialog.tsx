import dayjs from 'dayjs'
import { Anvil, Inbox, RotateCcw } from 'lucide-react'
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
import { ReviewPreview } from '~/features/reviews/components/ReviewPreview'
import type { ReviewRatingState } from '~/features/reviews/components/ReviewRatingCheckbox'
import { useAddTopicEntityRelation } from '~/features/topics/api/addTopicEntityRelation'
import { useAddTopicSource } from '~/features/topics/api/addTopicSource'
import { EntityType } from '~/models/entity-relations.types'
import type { InheritOptions } from '~/models/learnable.types'
import { useAddSourceChild } from '../api/addSourceChild'
import { useAddSourceEntityRelation } from '../api/addSourceEntityRelation'
import { useAddSourcePrerequisite } from '../api/addSourcePrerequisite'
import { useCreateSource } from '../api/createSource'
import { useSetSourceParent } from '../api/setSourceParent'

export type SourceRelationship =
	| { kind: 'standalone' }
	| { kind: 'child'; parentSourceId: number }
	| { kind: 'parent'; childSourceId: number }
	| { kind: 'topic'; topicId: number }
	| { kind: 'practice'; practiceId: number }
	| { kind: 'topicRelated'; topicId: number }
	| { kind: 'sourceRelated'; sourceId: number }
	| { kind: 'sourcePrerequisite'; sourceId: number }

interface AddSourceDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	relationship?: SourceRelationship
	inherit?: InheritOptions
	onSuccess?: (sourceId: number) => void
}

export function AddSourceDialog({
	open,
	onOpenChange,
	relationship = { kind: 'standalone' },
	inherit,
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
	const [reviewDate, setReviewDate] = useState<Date | null>(() => new Date())

	// Toggle states
	const [inboxed, setInboxed] = useState(false)
	const [inheritFsrs, setInheritFsrs] = useState(false)
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

	const srsSource = useMemo(
		() => inherit?.fsrsState ?? null,
		[inherit?.fsrsState]
	)
	const hasInheritFsrs = srsSource !== null

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
		setReviewDate(new Date())
	}, [])

	// Reset toggle fields to defaults
	const resetToggleFields = useCallback(() => {
		setInboxed(false)
		setInheritFsrs(hasInheritFsrs)
		setSrsEnabled(false)
	}, [hasInheritFsrs])

	// Reset all fields when dialog opens
	useEffect(() => {
		if (open) {
			resetContentFields()
			resetToggleFields()
			setCreateMore(false)
		}
	}, [open, resetContentFields, resetToggleFields])

	// Create source handler
	const handleCreate = useCallback(async () => {
		try {
			let newSourceId: number | undefined

			// Build source data - inherit all SRS fields when toggle is on
			const shouldInherit = inheritFsrs && srsSource !== null

			const sourceData = {
				title: title.trim(),
				notes: notes.trim(),
				archived: false,
				inboxed,
				srs_enabled: srsEnabled,
				inherit_fsrs: shouldInherit
			}

			if (relationship.kind === 'standalone') {
				const source = await createSource({
					...sourceData,
					parent_id: null
				})
				newSourceId = source.id
			} else if (relationship.kind === 'child') {
				const response = await addSourceChild({
					parentId: relationship.parentSourceId,
					data: { child: sourceData }
				})
				newSourceId = response.child.id
			} else if (relationship.kind === 'parent') {
				const response = await setSourceParent({
					sourceId: relationship.childSourceId,
					parent: sourceData
				})
				newSourceId = response.parent.id
			} else if (relationship.kind === 'topic') {
				const response = await addTopicSource({
					topicId: relationship.topicId,
					source: sourceData
				})
				newSourceId = response.source.id
			} else if (relationship.kind === 'practice') {
				const response = await addPracticeSource({
					practiceId: relationship.practiceId,
					source: sourceData
				})
				newSourceId = response.source.id
			} else if (relationship.kind === 'topicRelated') {
				await addTopicSourceRelation({
					topicId: relationship.topicId,
					data: {
						to_entity_type: EntityType.Source,
						to_source: sourceData
					}
				})
			} else if (relationship.kind === 'sourceRelated') {
				await addSourceRelation({
					sourceId: relationship.sourceId,
					data: {
						to_entity_type: EntityType.Source,
						to_source: sourceData
					}
				})
			} else if (relationship.kind === 'sourcePrerequisite') {
				await addSourcePrerequisite({
					sourceId: relationship.sourceId,
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
					completed_at: reviewDate
						? dayjs(reviewDate).format('YYYY-MM-DD')
						: dayjs().format('YYYY-MM-DD')
				} as const
				await createReview(basePayload)
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
		relationship,
		srsSource,
		inheritFsrs,
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
		reviewDate,
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
					<ReviewPreview
						date={reviewDate}
						description={reviewDescription}
						notes={reviewNotes}
						onDateChange={setReviewDate}
						onDescriptionChange={setReviewDescription}
						onNotesChange={setReviewNotes}
						onRatingChange={setReviewRating}
						onShowChange={setShowReview}
						rating={reviewRating}
						show={showReview}
					/>

					{/* Bottom Controls */}
					<div className='flex flex-wrap items-center gap-2 border-t pt-4'>
						{/* Inbox Toggle */}
						<Tooltip>
							<TooltipTrigger
								render={
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
								}
							/>
							<TooltipContent>Add to inbox</TooltipContent>
						</Tooltip>

						{/* Inherit SRS Toggle (when available) */}
						{hasInheritFsrs && (
							<Tooltip>
								<TooltipTrigger
									render={
										<span>
											<Toggle
												aria-label='Inherit SRS state'
												onPressedChange={setInheritFsrs}
												pressed={inheritFsrs}
												size='sm'
												variant='outline'
											>
												<Anvil className='h-4 w-4' />
												<span className='ml-1 text-xs'>Inherit SRS</span>
											</Toggle>
										</span>
									}
								/>
								<TooltipContent>
									Inherit SRS state from source entity
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
							<TooltipTrigger
								render={
									<Button onClick={resetToggleFields} size='sm' variant='ghost'>
										<RotateCcw className='h-4 w-4' />
									</Button>
								}
							/>
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
