import * as styles from './LoadingState.css'

type LoadingStateProps = {
	label: string
}

export function LoadingState({ label }: LoadingStateProps) {
	return (
		<div className={styles.root}>
			<div aria-hidden={true} className={styles.spinner} />
			<span>{label}</span>
		</div>
	)
}
