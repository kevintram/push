import dayjs from 'dayjs'
import { Anvil, Inbox, Star } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog'
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'
import { Toggle } from '~/components/ui/toggle'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/tooltip'
import { useCreateReview } from '~/features/reviews/api/createReview'
import { ReviewPreview } from '~/features/reviews/components/ReviewPreview'
import type { ReviewRatingState } from '~/features/reviews/components/ReviewRatingCheckbox'
import { useAddSourcePractice } from '~/features/sources/api/addSourcePractice'
import { useAddTopicPractice } from '~/features/topics/api/addTopicPractice'
import { cn } from '~/lib/utils'
import type { InheritOptions } from '~/models/learnable.types'
import { useCreatePractice } from '../api/createPractice'

export type PracticeRelationship =
	| { kind: 'standalone' }
	| { kind: 'topic'; topicId: number }
	| { kind: 'source'; sourceId: number }

interface AddPracticeDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	relationship?: PracticeRelationship
	inherit?: InheritOptions
	onSuccess?: (practiceId: number) => void
}

export function AddPracticeDialog({
	open,
	onOpenChange,
	relationship = { kind: 'standalone' },
	inherit,
	onSuccess
}: AddPracticeDialogProps) {
	// Practice fields
	const [prompt, setPrompt] = useState('')
	const [answer, setAnswer] = useState('')

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
	const [srsEnabled, setSrsEnabled] = useState(true)

	// Footer state
	const [createMore, setCreateMore] = useState(false)

	// Refs
	const promptRef = useRef<HTMLTextAreaElement>(null)

	// Mutations
	const { mutateAsync: createPractice, isPending: isCreatingPractice } =
		useCreatePractice()
	const { mutateAsync: addTopicPractice, isPending: isAddingTopicPractice } =
		useAddTopicPractice()
	const { mutateAsync: addSourcePractice, isPending: isAddingSourcePractice } =
		useAddSourcePractice()
	const { mutateAsync: createReview, isPending: isCreatingReview } =
		useCreateReview()

	const isPending =
		isCreatingPractice ||
		isAddingTopicPractice ||
		isAddingSourcePractice ||
		isCreatingReview

	const srsSource = useMemo(
		() => inherit?.fsrsState ?? null,
		[inherit?.fsrsState]
	)
	const hasInheritFsrs = srsSource !== null

	// Focus prompt field on open
	useEffect(() => {
		if (open && promptRef.current) {
			// Small delay to ensure dialog is rendered
			requestAnimationFrame(() => {
				promptRef.current?.focus()
			})
		}
	}, [open])

	// Reset content fields (for create more)
	const resetContentFields = useCallback(() => {
		setPrompt('')
		setAnswer('')
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

	// Create practice handler
	const handleCreate = useCallback(async () => {
		try {
			let newPracticeId: number | undefined

			const shouldInherit = inheritFsrs && srsSource !== null

			const practiceData = {
				prompt: prompt.trim(),
				answer: answer.trim(),
				archived: false,
				inboxed,
				srs_enabled: srsEnabled,
				inherit_fsrs: shouldInherit
			}

			if (relationship.kind === 'standalone') {
				const practice = await createPractice(practiceData)
				newPracticeId = practice.id
			} else if (relationship.kind === 'topic') {
				const practice = await addTopicPractice({
					topicId: relationship.topicId,
					practice: practiceData
				})
				newPracticeId = practice.id
			} else if (relationship.kind === 'source') {
				const practice = await addSourcePractice({
					sourceId: relationship.sourceId,
					practice: practiceData
				})
				newPracticeId = practice.id
			}

			// Create review if review section was used and rating was set
			if (newPracticeId && showReview && reviewRating !== 'uncompleted') {
				const basePayload = {
					practice_id: newPracticeId,
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
			if (newPracticeId) {
				onSuccess?.(newPracticeId)
			}

			// Handle create more vs close
			if (createMore) {
				resetContentFields()
				// Focus prompt field again
				requestAnimationFrame(() => {
					promptRef.current?.focus()
				})
			} else {
				onOpenChange(false)
			}
		} catch (_error) {
			toast.error('Failed to create practice')
		}
	}, [
		prompt,
		answer,
		inboxed,
		srsEnabled,
		relationship,
		srsSource,
		inheritFsrs,
		createPractice,
		addTopicPractice,
		addSourcePractice,
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
					<DialogTitle>New Practice</DialogTitle>
				</DialogHeader>

				<div className='flex flex-1 flex-col gap-4 overflow-y-auto py-2'>
					{/* Prompt and Answer */}
					<div className='flex flex-col gap-2'>
						<Textarea
							className='!bg-transparent break-word !text-xl m-0 min-h-0 w-full resize-none overflow-hidden rounded-none border-none p-0 font-semibold shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
							onChange={e => setPrompt(e.target.value)}
							placeholder='Prompt'
							ref={promptRef}
							spellCheck={false}
							value={prompt}
						/>
						<Textarea
							className='!bg-transparent m-0 w-full resize-none overflow-hidden rounded-none border-none p-0 shadow-none focus-visible:border-none focus-visible:ring-0'
							onChange={e => setAnswer(e.target.value)}
							placeholder='Answer'
							spellCheck={false}
							value={answer}
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
							<TooltipTrigger render={<span className='inline-flex' />}>
								<Toggle
									aria-label={inboxed ? 'Remove from inbox' : 'Add to inbox'}
									className={cn(
										'h-8 w-8 rounded-full p-0 text-muted-foreground transition-colors',
										'data-[state=on]:bg-muted data-[state=on]:text-foreground'
									)}
									onPressedChange={setInboxed}
									pressed={inboxed}
									size='sm'
									variant='outline'
								>
									<Inbox className='h-4 w-4' />
								</Toggle>
							</TooltipTrigger>
							<TooltipContent>Add to inbox</TooltipContent>
						</Tooltip>

						{/* Inherit SRS Toggle (when available) */}
						{hasInheritFsrs && (
							<Tooltip>
								<TooltipTrigger render={<span className='inline-flex' />}>
									<Toggle
										aria-label='Inherit SRS state'
										className={cn(
											'rounded-full px-3 text-muted-foreground transition-colors',
											'data-[state=on]:bg-muted data-[state=on]:text-foreground'
										)}
										onPressedChange={setInheritFsrs}
										pressed={inheritFsrs}
										size='sm'
										variant='outline'
									>
										<Anvil className='h-4 w-4' />
										<span className='ml-1 text-xs'>Inherit SRS</span>
									</Toggle>
								</TooltipTrigger>
								<TooltipContent>
									Inherit SRS state from source entity
								</TooltipContent>
							</Tooltip>
						)}

						{/* Show in Review Queue Toggle */}
						<Tooltip>
							<TooltipTrigger render={<span className='inline-flex' />}>
								<Toggle
									aria-label='Show in review queue'
									className={cn(
										'h-8 w-8 rounded-full p-0 text-muted-foreground transition-colors',
										'data-[state=on]:bg-muted data-[state=on]:text-foreground'
									)}
									onPressedChange={setSrsEnabled}
									pressed={srsEnabled}
									size='sm'
									variant='outline'
								>
									<Star
										className={
											srsEnabled
												? 'h-4 w-4 fill-yellow-500 text-yellow-500'
												: 'h-4 w-4 text-muted-foreground'
										}
									/>
								</Toggle>
							</TooltipTrigger>
							<TooltipContent>Show in review queue</TooltipContent>
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
