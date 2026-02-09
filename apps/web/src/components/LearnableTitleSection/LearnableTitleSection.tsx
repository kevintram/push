import { BookOpen, MoreHorizontal } from 'lucide-react'
import type { ChangeEvent, ReactNode } from 'react'
import { BookOpenOff } from '~/components/icons'
import { Button } from '~/components/ui/Button'
import { Textarea } from '~/components/ui/Textarea'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import type { LearnableBase } from '~/models/learnable.types'

interface LearnableTitleSectionProps<T extends LearnableBase> {
	title: string
	onTitleChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
	entity: T
	onSrsToggle: (pressed: boolean) => void
	isUpdating: boolean
	sidebarReadonly: boolean
	/**
	 * Render prop for the action menu. Receives the default trigger button.
	 */
	renderActionMenu: (trigger: ReactNode) => ReactNode
}

export function LearnableTitleSection<T extends LearnableBase>({
	title,
	onTitleChange,
	entity,
	onSrsToggle,
	isUpdating,
	sidebarReadonly,
	renderActionMenu
}: LearnableTitleSectionProps<T>) {
	const actionMenuTrigger = (
		<Button size='icon-sm' title='More options' variant='outline'>
			<MoreHorizontal className='h-5 w-5' />
		</Button>
	)

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
					<TooltipTrigger
						render={
							<Button
								disabled={isUpdating || sidebarReadonly}
								onClick={() => onSrsToggle(!(entity.srs_enabled ?? true))}
								size='icon-sm'
								variant='outline'
							>
								{(entity.srs_enabled ?? true) ? (
									<BookOpen className='h-5 w-5 text-green-500' />
								) : (
									<BookOpenOff className='h-5 w-5 text-muted-foreground' />
								)}
							</Button>
						}
					/>
					<TooltipContent side='bottom'>Surface in review page</TooltipContent>
				</Tooltip>
				{renderActionMenu(actionMenuTrigger)}
			</div>
		</div>
	)
}
