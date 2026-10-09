import * as stylex from '@stylexjs/stylex'

export interface TreeProps extends Omit<
	React.ComponentProps<'ul'>,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	root: {
		margin: 0,
		padding: 0,
		gap: 0,
		display: 'flex',
		flexDirection: 'column',
		listStyleType: 'none',
	},
})

export function Tree({ xstyle, ...props }: TreeProps) {
	return (
		<ul
			data-slot='tree'
			{...stylex.props(styles.root, xstyle)}
			{...props}
		/>
	)
}
