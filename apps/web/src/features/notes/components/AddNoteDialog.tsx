import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { Anvil, BookOpen, Inbox, Plus, Star } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
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
import { cn } from '~/lib/utils'
import { useCreateNote } from '../api/createNote'
import {
	NOTE_TAG_OPTIONS,
	normalizeNoteTags
} from '../constants/noteTagOptions'
import {
	getReadingStatusOption,
	type ReadingStatusOption
} from '../constants/readingStatusOptions'
import type { Note, NoteTag } from '../types/note.types'
import { NoteReadingStatusPopover } from './NoteReadingStatusPopover'

export interface AddNoteDialogDefaults {
	title?: string
	body?: string
	tags?: Array<NoteTag>
	parent_id?: number | null
	inboxed?: boolean
	archived?: boolean
	in_reading_list?: boolean
	reading_status?: Note['reading_status']
	reading_notes?: string
	srs_enabled?: boolean
}

interface AddNoteDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	defaults?: AddNoteDialogDefaults
	inheritSrsEnabled?: boolean | null
	onSuccess?: (note: Note) => void | Promise<void>
}

export function AddNoteDialog({
	open,
	onOpenChange,
	defaults,
	inheritSrsEnabled = null,
	onSuccess
}: AddNoteDialogProps) {
	const navigate = useNavigate()
	const titleRef = useRef<HTMLTextAreaElement>(null)
	const tagMenuTriggerRef = useRef<HTMLButtonElement>(null)
	const wasOpenRef = useRef(false)

	const { mutateAsync: createNote, isPending: isCreatingNote } = useCreateNote()
	const { mutateAsync: createReview, isPending: isCreatingReview } =
		useCreateReview()

	const [title, setTitle] = useState('')
	const [body, setBody] = useState('')
	const [tags, setTags] = useState<Array<NoteTag>>([])
	const [inboxed, setInboxed] = useState(false)
	const [inReadingList, setInReadingList] = useState(false)
	const [readingStatus, setReadingStatus] =
		useState<Note['reading_status']>('NEW')
	const [readingNotes, setReadingNotes] = useState('')
	const [isReadingStatusOpen, setIsReadingStatusOpen] = useState(false)
	const [tagMenuSide, setTagMenuSide] = useState<'left' | 'bottom'>('left')
	const [inheritSrs, setInheritSrs] = useState(false)
	const [srsEnabled, setSrsEnabled] = useState(true)
	const [createMore, setCreateMore] = useState(false)

	const [showReview, setShowReview] = useState(false)
	const [reviewRating, setReviewRating] =
		useState<ReviewRatingState>('uncompleted')
	const [reviewDescription, setReviewDescription] = useState('')
	const [reviewNotes, setReviewNotes] = useState('')
	const [reviewDate, setReviewDate] = useState<Date | null>(() => new Date())

	const hasInheritSrs = inheritSrsEnabled !== null
	const isPending = isCreatingNote || isCreatingReview

	const resetReviewFields = useCallback(() => {
		setShowReview(false)
		setReviewRating('uncompleted')
		setReviewDescription('')
		setReviewNotes('')
		setReviewDate(new Date())
	}, [])

	useEffect(() => {
		if (open && !wasOpenRef.current) {
			setTitle(defaults?.title ?? '')
			setBody(defaults?.body ?? '')
			setTags(normalizeNoteTags(defaults?.tags ?? []))
			setInboxed(defaults?.inboxed ?? false)
			setInReadingList(defaults?.in_reading_list ?? false)
			setReadingStatus(defaults?.reading_status ?? 'NEW')
			setReadingNotes(defaults?.reading_notes ?? '')
			setIsReadingStatusOpen(false)
			setInheritSrs(hasInheritSrs)
			setSrsEnabled(defaults?.srs_enabled ?? true)
			setCreateMore(false)
			resetReviewFields()
			requestAnimationFrame(() => {
				titleRef.current?.focus()
			})
		}
		wasOpenRef.current = open
	}, [defaults, hasInheritSrs, open, resetReviewFields])

	const selectedTagOptions = useMemo(
		() => NOTE_TAG_OPTIONS.filter(option => tags.includes(option.value)),
		[tags]
	)

	const toggleTag = useCallback((tag: NoteTag) => {
		setTags(previous => {
			if (previous.includes(tag)) {
				return previous.filter(value => value !== tag)
			}
			return normalizeNoteTags([...previous, tag])
		})
	}, [])

	const currentStatusOption: ReadingStatusOption = useMemo(
		() => getReadingStatusOption(readingStatus),
		[readingStatus]
	)
	const CurrentStatusIcon = currentStatusOption.icon

	const addToReadingList = useCallback(() => {
		setInReadingList(true)
		setReadingStatus('NEW')
		setIsReadingStatusOpen(true)
	}, [])
	const updateTagMenuSide = useCallback(
		(trigger?: HTMLButtonElement | null) => {
			const element = trigger ?? tagMenuTriggerRef.current
			if (!element) {
				setTagMenuSide('bottom')
				return
			}
			const leftSpace = element.getBoundingClientRect().left
			const menuWidth = 144
			const sideOffset = 6
			const edgePadding = 8
			const canOpenLeft = leftSpace - menuWidth - sideOffset >= edgePadding
			setTagMenuSide(canOpenLeft ? 'left' : 'bottom')
		},
		[]
	)

	const handleCreate = useCallback(async () => {
		try {
			const resolvedSrsEnabled =
				inheritSrs && inheritSrsEnabled !== null
					? inheritSrsEnabled
					: srsEnabled

			const note = await createNote({
				title: title.trim(),
				body: body.trim(),
				parent_id: defaults?.parent_id,
				inboxed,
				archived: defaults?.archived ?? false,
				in_reading_list: inReadingList,
				reading_status: inReadingList ? readingStatus : undefined,
				reading_notes: inReadingList ? readingNotes.trim() : undefined,
				tags,
				srs_enabled: resolvedSrsEnabled
			})

			if (showReview && reviewRating !== 'uncompleted') {
				await createReview({
					note_id: note.id,
					rating: reviewRating,
					description: reviewDescription.trim(),
					notes: reviewNotes.trim(),
					scheduled_at: null,
					completed_at: reviewDate
						? dayjs(reviewDate).format('YYYY-MM-DD')
						: dayjs().format('YYYY-MM-DD')
				})
			}

			toast('Note created', {
				action: {
					label: 'Open',
					onClick: () =>
						navigate({
							to: '/notes/$noteId',
							params: { noteId: note.id.toString() }
						})
				}
			})

			if (onSuccess) {
				await onSuccess(note)
			}

			if (createMore) {
				setTitle('')
				setBody('')
				resetReviewFields()
				requestAnimationFrame(() => {
					titleRef.current?.focus()
				})
				return
			}

			onOpenChange(false)
		} catch {
			toast.error('Failed to create note')
		}
	}, [
		body,
		createMore,
		createNote,
		createReview,
		defaults?.archived,
		defaults?.parent_id,
		inboxed,
		inReadingList,
		inheritSrs,
		inheritSrsEnabled,
		navigate,
		onOpenChange,
		onSuccess,
		readingNotes,
		readingStatus,
		resetReviewFields,
		reviewDate,
		reviewDescription,
		reviewNotes,
		reviewRating,
		showReview,
		srsEnabled,
		tags,
		title
	])

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className='flex max-h-[85vh] flex-col sm:max-w-[560px]'>
				<DialogHeader>
					<DialogTitle>New Note</DialogTitle>
				</DialogHeader>

				<div className='flex flex-1 flex-col gap-4 overflow-y-auto py-2'>
					<div className='flex min-w-0 flex-wrap items-center gap-2'>
						<DropdownMenu
							onOpenChange={nextOpen => {
								if (nextOpen) updateTagMenuSide()
							}}
						>
							<DropdownMenuTrigger
								render={
									<button
										className='flex items-center gap-2 rounded-md bg-transparent p-0 text-left'
										disabled={isPending}
										onPointerDown={event =>
											updateTagMenuSide(event.currentTarget)
										}
										ref={tagMenuTriggerRef}
										type='button'
									>
										<span className='text-muted-foreground text-xs'>Tags</span>
										{selectedTagOptions.map(option => (
											<Badge key={option.value} variant='secondary'>
												{option.label}
											</Badge>
										))}
										{selectedTagOptions.length === 0 ? (
											<span className='inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'>
												<Plus className='h-4 w-4' />
											</span>
										) : null}
									</button>
								}
							/>
							<DropdownMenuContent
								align='start'
								className='min-w-36'
								collisionAvoidance={{
									side: 'shift',
									align: 'shift',
									fallbackAxisSide: 'none'
								}}
								matchTriggerWidth={false}
								side={tagMenuSide}
								sideOffset={6}
							>
								<DropdownMenuGroup>
									{NOTE_TAG_OPTIONS.map(option => (
										<DropdownMenuCheckboxItem
											checked={tags.includes(option.value)}
											disabled={isPending}
											key={option.value}
											onCheckedChange={() => toggleTag(option.value)}
										>
											{option.label}
										</DropdownMenuCheckboxItem>
									))}
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div className='flex flex-col gap-2'>
						<Textarea
							className='!bg-transparent break-word !text-xl m-0 min-h-0 w-full resize-none overflow-hidden rounded-none border-none p-0 font-semibold shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
							onChange={event => setTitle(event.target.value)}
							placeholder='Title'
							ref={titleRef}
							spellCheck={false}
							value={title}
						/>
						<Textarea
							className='!bg-transparent m-0 w-full resize-none overflow-hidden rounded-none border-none p-0 shadow-none focus-visible:border-none focus-visible:ring-0'
							onChange={event => setBody(event.target.value)}
							placeholder='Notes'
							spellCheck={false}
							value={body}
						/>
					</div>

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

					<div className='flex flex-wrap items-center gap-2 border-t pt-4'>
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

						{inReadingList ? (
							<Tooltip>
								<TooltipTrigger render={<span className='inline-flex' />}>
									<NoteReadingStatusPopover
										align='start'
										disabled={isPending}
										onOpenChange={setIsReadingStatusOpen}
										onProgressNoteChange={event =>
											setReadingNotes(event.target.value)
										}
										onRemoveFromReadingList={() => {
											setIsReadingStatusOpen(false)
											setInReadingList(false)
										}}
										onStatusChange={setReadingStatus}
										open={isReadingStatusOpen}
										progressNote={readingNotes}
										side='bottom'
										sideOffset={6}
										status={readingStatus}
										trigger={
											<Button
												aria-label={`Status: ${currentStatusOption.label}`}
												className='rounded-full'
												disabled={isPending}
												size='icon-sm'
												variant='outline'
											>
												<CurrentStatusIcon
													className={`h-3.5 w-3.5 ${currentStatusOption.colorClassName}`}
												/>
											</Button>
										}
									/>
								</TooltipTrigger>
								<TooltipContent>Change reading status</TooltipContent>
							</Tooltip>
						) : (
							<Tooltip>
								<TooltipTrigger render={<span className='inline-flex' />}>
									<Button
										aria-label='Add to reading list'
										className='rounded-full'
										disabled={isPending}
										onClick={addToReadingList}
										size='icon-sm'
										variant='outline'
									>
										<BookOpen className='h-4 w-4 text-muted-foreground' />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Add to reading list</TooltipContent>
							</Tooltip>
						)}

						{hasInheritSrs && (
							<Tooltip>
								<TooltipTrigger render={<span className='inline-flex' />}>
									<Toggle
										aria-label='Inherit SRS setting'
										className={cn(
											'rounded-full px-3 text-muted-foreground transition-colors',
											'data-[state=on]:bg-muted data-[state=on]:text-foreground'
										)}
										onPressedChange={setInheritSrs}
										pressed={inheritSrs}
										size='sm'
										variant='outline'
									>
										<Anvil className='h-4 w-4' />
										<span className='ml-1 text-xs'>Inherit SRS</span>
									</Toggle>
								</TooltipTrigger>
								<TooltipContent>
									Inherit SRS setting from parent note
								</TooltipContent>
							</Tooltip>
						)}

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
