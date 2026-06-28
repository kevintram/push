type TopicDetailOutlineLabelProps = {
	label: string
	sectionNumber: string | null
}

export function TopicDetailOutlineLabel({
	label,
	sectionNumber,
}: TopicDetailOutlineLabelProps) {
	return (
		<span className='min-w-0 truncate'>
			{sectionNumber ? (
				<span className='whitespace-nowrap font-medium text-[0.72rem] text-slate-400 tabular-nums leading-none tracking-[0.01em] dark:text-slate-500'>
					{sectionNumber}{' '}
				</span>
			) : null}
			<span>{label}</span>
		</span>
	)
}
