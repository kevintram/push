import * as stylex from '@stylexjs/stylex'

import { styles } from './LoadingState.stylex'

type LoadingStateProps = {
	label: string
}

export function LoadingState({ label }: LoadingStateProps) {
	return (
		<div {...stylex.props(styles.root)}>
			<div aria-hidden={true} {...stylex.props(styles.spinner)} />
			<span>{label}</span>
		</div>
	)
}
