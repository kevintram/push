import { Textarea } from '~/components/ui/textarea'

export function ReviewCardDetailNotesTab({
	flushNotes,
	notes,
	onNotesChange
}: {
	flushNotes: () => void
	notes: string
	onNotesChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
}) {
	return (
		<div className='flex min-h-0 flex-1 flex-col gap-2 py-2'>
			<div className='flex items-center justify-between gap-2'>
				<h2 className='font-semibold text-lg'>Notes</h2>
			</div>
			<Textarea
				className='!bg-transparent field-sizing-fixed m-0 h-full min-h-[2lh] flex-1 resize-none overflow-hidden break-words rounded-none border-none p-0 text-base leading-relaxed shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
				onBlur={flushNotes}
				onChange={onNotesChange}
				placeholder='Add notes...'
				spellCheck={false}
				value={notes}
			/>
		</div>
	)
}
