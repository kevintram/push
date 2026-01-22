import type { ChangeEvent } from 'react'
import { LearnableTitleSection } from '~/components/LearnableTitleSection'
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
		<LearnableTitleSection
			entity={source}
			isUpdating={isUpdating}
			onSrsToggle={onSrsToggle}
			onTitleChange={onTitleChange}
			renderActionMenu={trigger => (
				<SourceActionMenu
					onDelete={onDelete}
					onSourceUpdateSuccess={onSourceUpdateSuccess}
					source={source}
					trigger={trigger}
				/>
			)}
			sidebarReadonly={sidebarReadonly}
			title={title}
		/>
	)
}
