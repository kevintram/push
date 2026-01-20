import { BookOpen, MoreHorizontal } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { BookOpenOff } from '~/components/icons'
import { Button } from '~/components/ui/Button'
import { Textarea } from '~/components/ui/Textarea'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import type { Source } from '../../types/source.types'
import { SourceActionMenu } from '../SourceActionMenu'

interface SourceTitleSectionProps {
	title: string
	onTitleChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
	source: Source
	onSrsToggle: (pressed: boolean) => void
	isUpdating: boolean
	sidebarReadonly: boolean
	onDelete?: () => void | Promise<void>
	onSourceUpdateSuccess: (source: Source) => void
}

export function SourceTitleSection({
	title,
	onTitleChange,
	source,
	onSrsToggle,
	isUpdating,
	sidebarReadonly,
	onDelete,
	onSourceUpdateSuccess
}: SourceTitleSectionProps) {
	return (
		<div className='flex items-start gap-2'>
			<Textarea
				className='!mt-0.5 !bg-transparent break-word !text-xl m-0 min-h-0 flex-1 resize-none overflow-hidden rounded-none border-none p-0 font-extrabold shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
				onChange={onTitleChange}
				placeholder='Title'
				spellCheck={false}
				value={title}
			/>
			<div className='flex items-center gap-2'>
				<Tooltip>
					<TooltipTrigger asChild={true}>
						<Button
							disabled={isUpdating || sidebarReadonly}
							onClick={() => onSrsToggle(!(source.srs_enabled ?? true))}
							size='icon-sm'
							variant='outline'
						>
							{(source.srs_enabled ?? true) ? (
								<BookOpen className='h-5 w-5 text-green-500' />
							) : (
								<BookOpenOff className='h-5 w-5 text-muted-foreground' />
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent side='bottom'>Surface in review page</TooltipContent>
				</Tooltip>
				<SourceActionMenu
					onDelete={onDelete}
					onSourceUpdateSuccess={onSourceUpdateSuccess}
					source={source}
					trigger={
						<Button size='icon-sm' title='More options' variant='outline'>
							<MoreHorizontal className='h-5 w-5' />
						</Button>
					}
				/>
			</div>
		</div>
	)
}
