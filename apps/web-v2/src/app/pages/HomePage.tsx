import * as styles from './HomePage.css'

export function HomePage() {
	return (
		<main className={styles.page}>
			<section className={styles.hero}>
				<p className={styles.eyebrow}>3gulp v2</p>
				<h1 className={styles.title}>
					A clean foundation for the rewrite.
				</h1>
			</section>
		</main>
	)
}
