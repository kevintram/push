import dayjs from 'dayjs'
import { BicepsFlexed, Inbox, Plus, RotateCcw, SquareStack } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
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
import { useCreateReview } from '~/features/reviews/api/createReview'
import {
	ReviewRatingCheckbox,
	type ReviewRatingState
} from '~/features/reviews/components/ReviewRatingCheckbox'
import { SessionPickerPopover } from '~/features/reviews/components/SessionPickerPopover'
import type { LearningState } from '~/models/learning-state.types'
import { useCreateTopic } from '../api/createTopic'
import { useCreateTopicOtherRelationship } from '../api/createTopicOtherRelationship'
import { useCreateRelationship } from '../api/createTopicRelationship'

export type AddTopicDialogContext =
	| { type: 'standalone' }
	| {
			type: 'child'
			parentTopicId: number
			parentStability?: number | null
			parentDifficulty?: number | null
			parentState?: LearningState | null
			parentLastReviewedAt?: string | null
	  }
	| { type: 'parent'; childTopicId: number }
	| { type: 'related'; fromTopicId: number }

interface AddTopicDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	context?: AddTopicDialogContext
	onSuccess?: (topicId: number) => void
}

export function AddTopicDialog({
	open,
	onOpenChange,
	context = { type: 'standalone' },
	onSuccess
}: AddTopicDialogProps) {
	// Topic fields
	const [name, setName] = useState('')
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
	const nameRef = useRef<HTMLTextAreaElement>(null)

	// Mutations
	const { mutateAsync: createTopic, isPending: isCreatingTopic } =
		useCreateTopic()
	const { mutateAsync: createRelationship, isPending: isCreatingRelationship } =
		useCreateRelationship()
	const {
		mutateAsync: createOtherRelationship,
		isPending: isCreatingOtherRelationship
	} = useCreateTopicOtherRelationship()
	const { mutateAsync: createReview, isPending: isCreatingReview } =
		useCreateReview()

	const isPending =
		isCreatingTopic ||
		isCreatingRelationship ||
		isCreatingOtherRelationship ||
		isCreatingReview

	// Focus name field on open
	useEffect(() => {
		if (open && nameRef.current) {
			// Small delay to ensure dialog is rendered
			requestAnimationFrame(() => {
				nameRef.current?.focus()
			})
		}
	}, [open])

	// Reset content fields (for create more)
	const resetContentFields = useCallback(() => {
		setName('')
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

	// Handle rating change - set completed_at when rating is set
	const handleRatingChange = useCallback((newRating: ReviewRatingState) => {
		setReviewRating(newRating)
	}, [])

	// Create topic handler
	const handleCreate = useCallback(async () => {
		try {
			let newTopicId: number

			// Build topic data - inherit all SRS fields when toggle is on
			const shouldInherit =
				context.type === 'child' &&
				inheritStability &&
				context.parentStability != null
			const topicData = {
				name: name.trim(),
				notes: notes.trim(),
				archived: false,
				inboxed,
				srs_enabled: srsEnabled,
				// Only inherit SRS state when toggle is on and we have parent stability
				stability: shouldInherit ? (context.parentStability ?? null) : null,
				difficulty: shouldInherit ? (context.parentDifficulty ?? null) : null,
				state: shouldInherit ? (context.parentState ?? undefined) : undefined,
				// Set inherited fields so FSRS replay knows the starting point
				inherited_stability: shouldInherit
					? (context.parentStability ?? null)
					: null,
				inherited_difficulty: shouldInherit
					? (context.parentDifficulty ?? null)
					: null,
				inherited_state: shouldInherit ? (context.parentState ?? null) : null,
				inherited_last_review: shouldInherit
					? (context.parentLastReviewedAt ?? null)
					: null
			}

			// Create topic based on context
			if (context.type === 'standalone') {
				const topic = await createTopic(topicData)
				newTopicId = topic.id
			} else if (context.type === 'child') {
				const response = await createRelationship({
					parent: context.parentTopicId,
					childData: topicData
				})
				newTopicId = response.child.id
			} else if (context.type === 'parent') {
				const response = await createRelationship({
					child: context.childTopicId,
					parentData: topicData
				})
				newTopicId = response.parent.id
			} else {
				// context.type === 'related'
				const response = await createOtherRelationship({
					fromTopicId: context.fromTopicId,
					data: { to_topic: topicData }
				})
				newTopicId = response.to_topic.id
			}

			// Create review if review section was used and rating was set
			if (showReview && reviewRating !== 'uncompleted') {
				const basePayload = {
					topic_id: newTopicId,
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
			onSuccess?.(newTopicId)

			// Handle create more vs close
			if (createMore) {
				resetContentFields()
				// Focus name field again
				requestAnimationFrame(() => {
					nameRef.current?.focus()
				})
			} else {
				onOpenChange(false)
			}
		} catch (_error) {}
	}, [
		name,
		notes,
		inboxed,
		srsEnabled,
		context,
		inheritStability,
		createTopic,
		createRelationship,
		createOtherRelationship,
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

	// Show inherit SRS option only for child context with parent stability
	const showInheritSrs =
		context.type === 'child' && context.parentStability != null

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className='flex max-h-[85vh] flex-col sm:max-w-[500px]'>
				<DialogHeader>
					<DialogTitle>New Topic</DialogTitle>
				</DialogHeader>

				<div className='flex flex-1 flex-col gap-4 overflow-y-auto py-2'>
					{/* Name and Notes */}
					<div className='flex flex-col gap-2'>
						<Textarea
							className='!bg-transparent break-word !text-xl m-0 min-h-0 w-full resize-none overflow-hidden rounded-none border-none p-0 font-semibold shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
							onChange={e => setName(e.target.value)}
							placeholder='Title'
							ref={nameRef}
							spellCheck={false}
							value={name}
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

						{/* Inherit SRS Toggle (only for child context) */}
						{showInheritSrs && (
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
											<BicepsFlexed className='h-4 w-4' />
											<span className='ml-1 text-xs'>Inherit SRS</span>
										</Toggle>
									</span>
								</TooltipTrigger>
								<TooltipContent>
									Inherit SRS state from parent topic
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
