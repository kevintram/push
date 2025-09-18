import { useUpdateMutation } from '@supabase-cache-helpers/postgrest-react-query'
import {
	ArchiveRestore,
	Baby,
	ChevronDown,
	Info,
	RotateCcw,
	Sprout,
	Star,
	UserPlus,
	Users
} from 'lucide-react'
import { use, useCallback, useEffect, useMemo, useRef } from 'react'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { Progress } from '~/components/ui/Progress'
import { useAutoSave } from '~/hooks/useAutoSave'
import { cn } from '~/lib/utils'
import { supabase } from '~/utils/supabase'
import { TopicHubContext } from '../../stores/SelectedTopicContext'
import { numDaysElapsedFrom } from '../../utils/daysElapsed'
import { getRetrievabilityColorClass } from '../../utils/getRetrievabilityColor'

export function TopicHeader() {
	const { selectedTopic } = use(TopicHubContext)

	const { mutateAsync: updateTopicMutation } = useUpdateMutation(
		supabase.from('topics'),
		['id'],
		'*'
	)

	const updateNameMutation = useCallback(
		(newTitle: string) => {
			if (!selectedTopic) return
			updateTopicMutation({ id: selectedTopic.id, name: newTitle })
		},
		[updateTopicMutation, selectedTopic]
	)

	const { value: title, onChange: onNameChange } = useAutoSave({
		initialValue: selectedTopic?.name ?? '',
		onSave: updateNameMutation,
		key: `topics-${selectedTopic?.id}`
	})

	const textareaRef = useRef<HTMLTextAreaElement>(null)

	// Auto-resize textarea based on content (we're doing this manually, css
	// property [field-sizing](https://developer.mozilla.org/en-US/docs/Web/CSS/field-sizing)
	// is still experiemental)
	const adjustTextareaHeight = useCallback(() => {
		const textarea = textareaRef.current
		if (textarea) {
			// Reset height and temporarily hide overflow to get accurate measurement
			textarea.style.height = 'auto'
			textarea.style.overflow = 'hidden'
			textarea.style.height = `${textarea.scrollHeight}px`
			textarea.style.overflow = 'visible'
		}
	}, [])

	// Adjust height when content changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: title is needed to trigger height recalculation on content changes
	useEffect(() => {
		adjustTextareaHeight()
	}, [title, adjustTextareaHeight])

	// Set up ResizeObserver to handle textareadimension changes
	useEffect(() => {
		const textarea = textareaRef.current
		if (!textarea) return

		// Use ResizeObserver to watch for any size changes to the textarea
		// This handles window resize, responsive breakpoints, font loading, etc.
		const resizeObserver = new ResizeObserver(() => {
			adjustTextareaHeight()
		})

		resizeObserver.observe(textarea)

		return () => {
			resizeObserver.disconnect()
		}
	}, [adjustTextareaHeight])

	const sinceLastReview = useMemo(
		() =>
			selectedTopic
				? numDaysElapsedFrom(new Date(selectedTopic.inserted_at))
				: 0,
		[selectedTopic]
	)

	if (!selectedTopic) {
		return null
	}

	const { retrievability, stability } = selectedTopic

	return (
		<div className='flex w-full flex-col gap-4'>
			<div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-0'>
				<div className='flex-1'>
					<textarea
						// biome-ignore lint/a11y/noAutofocus: because I feel like it's fine in this case
						autoFocus={title === ''}
						className='break-word w-full resize-none border-none bg-transparent font-bold text-xl focus:outline-none sm:flex-1 sm:pr-4 sm:text-2xl md:text-3xl'
						onChange={onNameChange}
						placeholder='Title...'
						ref={textareaRef}
						rows={1}
						spellCheck={false}
						value={title}
					/>
				</div>

				<div className='flex items-center gap-2 sm:mt-0.5'>
					<DropdownMenu>
						<DropdownMenuTrigger asChild={true}>
							<Button size='sm' variant='secondary'>
								<Baby className='h-4 w-4' />
								<span className='ml-1'>Populate</span>
								<ChevronDown className='ml-1 h-4 w-4' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem>
								<Users className='h-4 w-4' />
								Children
							</DropdownMenuItem>
							<DropdownMenuItem>
								<UserPlus className='h-4 w-4' />
								Grandchildren
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Star className='h-4 w-4' />
								All Descendants
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<DropdownMenu>
						<DropdownMenuTrigger asChild={true}>
							<Button size='sm' variant='ghost'>
								<Info className='h-4 w-4' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className='w-64'>
							{/* Retrievability */}
							<div className='flex items-center gap-3 p-2'>
								<ArchiveRestore className='h-4 w-4 text-muted-foreground' />
								<div className='flex-1'>
									<p className='font-medium text-sm'>Retrievability</p>
									<p className='text-muted-foreground text-xs'>
										<span
											className={cn(
												getRetrievabilityColorClass(retrievability)
											)}
										>
											{(retrievability * 100).toFixed(0)}%
										</span>
									</p>
								</div>
							</div>

							{/* Last Reviewed */}
							<div className='flex items-center gap-3 p-2'>
								<RotateCcw className='h-4 w-4 text-muted-foreground' />
								<div className='flex-1'>
									<p className='font-medium text-sm'>Last Reviewed</p>
									<p className='text-muted-foreground text-xs'>
										{sinceLastReview} days ago
									</p>
								</div>
							</div>

							{/* Stability */}
							<div className='flex items-center gap-3 p-2'>
								<div className='flex flex-col items-center gap-1'>
									<Progress className='h-1.5 w-8' max={365} value={stability} />
								</div>
								<div className='flex-1'>
									<p className='font-medium text-sm'>Stability</p>
									<p className='text-muted-foreground text-xs'>
										{stability}/365 days
									</p>
								</div>
							</div>

							{/* Born */}
							<div className='flex items-center gap-3 p-2'>
								<Sprout className='h-4 w-4 text-muted-foreground' />
								<div className='flex-1'>
									<p className='font-medium text-sm'>Born</p>
									<p className='text-muted-foreground text-xs'>
										{sinceLastReview} days ago
									</p>
								</div>
							</div>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</div>
	)
}
