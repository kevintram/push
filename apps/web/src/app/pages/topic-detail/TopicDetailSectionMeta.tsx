import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'

interface TopicDetailSectionMetaProps {
	createdDate: string
	createdText: string
	updatedDate: string
	updatedText: string
}

export function TopicDetailSectionMeta({
	createdDate,
	createdText,
	updatedDate,
	updatedText,
}: TopicDetailSectionMetaProps) {
	return (
		<div className='flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-[0.8125rem] text-muted-foreground/75 tracking-[0.01em]'>
			<Tooltip>
				<TooltipTrigger
					render={<span>{`Edited ${updatedText}`}</span>}
				/>
				<TooltipContent>{updatedDate}</TooltipContent>
			</Tooltip>
			<span aria-hidden={true}>·</span>
			<Tooltip>
				<TooltipTrigger
					render={<span>{`Created ${createdText}`}</span>}
				/>
				<TooltipContent>{createdDate}</TooltipContent>
			</Tooltip>
		</div>
	)
}
