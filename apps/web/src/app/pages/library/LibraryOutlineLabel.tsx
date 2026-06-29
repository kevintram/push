import { type ReactElement } from 'react'

type LibraryOutlineLabelProps = {
	label: string
	sectionNumber: string | null
}

export function LibraryOutlineLabel({
	label,
	sectionNumber,
}: LibraryOutlineLabelProps): ReactElement {
	const sectionNumberPrefix =
		sectionNumber == null ? null : (
			<span className='whitespace-nowrap font-medium text-[0.72rem] text-slate-400 tabular-nums leading-none tracking-[0.01em] dark:text-slate-500'>
				{sectionNumber}{' '}
			</span>
		)

	return (
		<span className='min-w-0 truncate'>
			{sectionNumberPrefix}
			<span>{label}</span>
		</span>
	)
}
