import type { MutableRefObject } from 'react'
import { Textarea } from '~/components/ui/textarea'
import { cn } from '~/lib/utils'

interface TopicComposerFieldsProps {
	name: string
	notes: string
	onNameChange: (value: string) => void
	onNotesChange: (value: string) => void
	namePlaceholder?: string
	notesPlaceholder?: string
	nameRef?: MutableRefObject<HTMLTextAreaElement | null>
	notesRef?: MutableRefObject<HTMLTextAreaElement | null>
	className?: string
}

export function TopicComposerFields({
	name,
	notes,
	onNameChange,
	onNotesChange,
	namePlaceholder = 'Topic Name',
	notesPlaceholder = 'Notes',
	nameRef,
	notesRef,
	className
}: TopicComposerFieldsProps) {
	return (
		<div className={cn('space-y-4', className)}>
			<textarea
				className='!bg-transparent break-word flex w-full resize-none border-none font-bold text-xl focus:outline-none'
				onChange={event => onNameChange(event.target.value)}
				placeholder={namePlaceholder}
				ref={nameRef}
				rows={1}
				spellCheck={false}
				value={name}
			/>

			<Textarea
				className='!bg-transparent min-h-48 w-full resize-none border-none p-0 shadow-none focus-visible:border-none focus-visible:ring-0'
				onChange={event => onNotesChange(event.target.value)}
				placeholder={notesPlaceholder}
				ref={notesRef}
				value={notes}
			/>
		</div>
	)
}
