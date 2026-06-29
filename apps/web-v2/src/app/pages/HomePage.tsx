import * as stylex from '@stylexjs/stylex'

import { styles } from './HomePage.stylex'

export function HomePage() {
	return (
		<main {...stylex.props(styles.page)}>
			<section {...stylex.props(styles.hero)}>
				<p {...stylex.props(styles.eyebrow)}>3gulp v2</p>
				<h1 {...stylex.props(styles.title)}>
					A clean foundation for the rewrite.
				</h1>
			</section>
		</main>
	)
}
